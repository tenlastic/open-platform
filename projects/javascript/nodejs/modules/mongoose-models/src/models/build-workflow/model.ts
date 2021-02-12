import {
  DocumentType,
  Ref,
  ReturnModelType,
  addModelToTypegoose,
  buildSchema,
  index,
  plugin,
  post,
  pre,
  prop,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import * as kubernetes from '../../kubernetes';
import { WorkflowBase } from '../../bases';
import { NamespaceEvent } from '../namespace';
import { BuildDocument } from '../build';

export const BuildWorkflowEvent = new EventEmitter<IDatabasePayload<BuildWorkflowDocument>>();

// Publish changes to Kafka.
BuildWorkflowEvent.on(payload => {
  kafka.publish(payload);
});

// Delete BuildWorkflows if associated Namespace is deleted.
NamespaceEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await BuildWorkflow.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ buildId: 1 })
@index({ namespaceId: 1 })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: BuildWorkflowEvent })
@pre('save', async function(this: BuildWorkflowDocument) {
  if (!this.populated('buildDocument')) {
    await this.populate('buildDocument').execPopulate();
  }

  this.namespaceId = this.buildDocument.namespaceId;
})
@post('remove', async function(this: BuildWorkflowDocument) {
  await kubernetes.Workflow.delete(this);
  await kubernetes.WorkflowSidecar.delete(this);
})
@post('save', async function(this: BuildWorkflowDocument) {
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
export class BuildWorkflowSchema extends WorkflowBase {
  @prop({ immutable: true, ref: 'BuildSchema', required: true })
  public buildId: Ref<BuildDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  public get kubernetesName() {
    return `workflow-${this._id}`;
  }
  public get kubernetesNamespace() {
    return `namespace-${this.namespaceId}`;
  }
}

export type BuildWorkflowDocument = DocumentType<BuildWorkflowSchema>;
export type BuildWorkflowModel = ReturnModelType<typeof BuildWorkflowSchema>;

const schema = buildSchema(BuildWorkflowSchema).set('collection', 'buildworkflows');
export const BuildWorkflow = addModelToTypegoose(
  mongoose.model('BuildWorkflowSchema', schema),
  BuildWorkflowSchema,
);
