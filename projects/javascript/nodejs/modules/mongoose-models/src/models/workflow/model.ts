import {
  DocumentType,
  ReturnModelType,
  addModelToTypegoose,
  index,
  plugin,
  post,
  buildSchema,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import * as kubernetes from '../../kubernetes';
import { WorkflowBase, WorkflowSpecTemplateSchema } from '../../bases';
import { Namespace, NamespaceEvent, NamespaceLimitError } from '../namespace';

export const WorkflowEvent = new EventEmitter<IDatabasePayload<WorkflowDocument>>();

// Publish changes to Kafka.
WorkflowEvent.on(payload => {
  kafka.publish(payload);
});

// Delete Workflows if associated Namespace is deleted.
NamespaceEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Workflow.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ namespaceId: 1 })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: WorkflowEvent })
@post('remove', async function(this: WorkflowDocument) {
  await kubernetes.Workflow.delete(this);
  await kubernetes.WorkflowSidecar.delete(this);
})
@post('save', async function(this: WorkflowDocument) {
  if (!this.populated('namespaceDocument')) {
    await this.populate('namespaceDocument').execPopulate();
  }

  if (this.wasNew) {
    await kubernetes.Workflow.create(this.namespaceDocument, this);
    await kubernetes.WorkflowSidecar.create(this);
  } else if (this.status && this.status.finishedAt) {
    await kubernetes.Workflow.delete(this);
    await kubernetes.WorkflowSidecar.delete(this);
  }
})
export class WorkflowSchema extends WorkflowBase {
  public get kubernetesName() {
    return `workflow-${this._id}`;
  }
  public get kubernetesNamespace() {
    return `namespace-${this.namespaceId}`;
  }

  public static async checkNamespaceLimits(
    isPreemptible: boolean,
    namespaceId: string | mongoose.Types.ObjectId,
    parallelism: number,
    templates: WorkflowSpecTemplateSchema[],
  ) {
    const namespace = await Namespace.findOne({ _id: namespaceId });
    if (!namespace) {
      throw new Error('Record not found.');
    }

    const limits = namespace.limits.workflows;

    const cpuSums = templates.map(t => {
      let sum = 0;

      if (t.script && t.script.resources && t.script.resources.cpu) {
        sum += t.script.resources.cpu;
      }
      if (t.sidecars) {
        t.sidecars.forEach(s => (sum += s.resources && s.resources.cpu ? s.resources.cpu : 0));
      }

      return sum;
    });
    if (limits.cpu > 0 && Math.max(...cpuSums) > limits.cpu) {
      throw new NamespaceLimitError('workflows.cpu', limits.cpu);
    }

    const memorySums = templates.map(t => {
      let sum = 0;

      if (t.script && t.script.resources && t.script.resources.memory) {
        sum += t.script.resources.memory;
      }
      if (t.sidecars) {
        t.sidecars.forEach(
          s => (sum += s.resources && s.resources.memory ? s.resources.memory : 0),
        );
      }

      return sum;
    });
    if (limits.memory > 0 && Math.max(...memorySums) > limits.memory) {
      throw new NamespaceLimitError('workflows.memory', limits.memory);
    }

    if (limits.parallelism && parallelism > limits.parallelism) {
      throw new NamespaceLimitError('workflows.parallelism', limits.parallelism);
    }

    if (limits.preemptible && isPreemptible === false) {
      throw new NamespaceLimitError('workflows.preemptible', limits.preemptible);
    }
  }
}

export type WorkflowDocument = DocumentType<WorkflowSchema>;
export type WorkflowModel = ReturnModelType<typeof WorkflowSchema>;

const schema = buildSchema(WorkflowSchema).set('collection', 'workflows');
export const Workflow = addModelToTypegoose(
  mongoose.model('WorkflowSchema', schema),
  WorkflowSchema,
);
