import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import { Namespace, NamespaceDocument, NamespaceEvent, NamespaceLimitError } from '../namespace';
import { WorkflowSpecSchema, WorkflowSpecTemplateSchema } from './spec';
import { WorkflowStatusSchema } from './status';

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
@modelOptions({
  schemaOptions: {
    collection: 'workflows',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: WorkflowEvent })
export class WorkflowSchema {
  public _id: mongoose.Types.ObjectId;

  public createdAt: Date;

  @prop({ immutable: true })
  public isPreemptible: boolean;

  @prop({ immutable: true, required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ immutable: true, required: true })
  public spec: WorkflowSpecSchema;

  @prop()
  public status: WorkflowStatusSchema;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;

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
export const Workflow = getModelForClass(WorkflowSchema);
