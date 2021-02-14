import {
  DocumentType,
  Ref,
  ReturnModelType,
  addModelToTypegoose,
  arrayProp,
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
import { BuildDocument } from '../build';
import { FilePlatform } from '../file';
import { Namespace, NamespaceDocument, NamespaceEvent } from '../namespace';
import { WorkflowStatusSchema } from '../workflow';

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
  await kubernetes.BuildWorkflow.delete(this);
  await kubernetes.WorkflowSidecar.delete(this.kubernetesName, this.kubernetesNamespace);
})
@post('save', async function(this: BuildWorkflowDocument) {
  if (!this.populated('namespaceDocument')) {
    await this.populate('namespaceDocument').execPopulate();
  }

  const isPreemptible = this.namespaceDocument.limits.workflows.preemptible;

  if (this.wasNew) {
    await kubernetes.BuildWorkflow.create(this, this.namespaceDocument);
    await kubernetes.WorkflowSidecar.create(
      this.id,
      this.kubernetesEndpoint,
      isPreemptible,
      this.kubernetesName,
      this.kubernetesNamespace,
    );
  } else if (this.status && this.status.finishedAt) {
    await kubernetes.BuildWorkflow.delete(this);
    await kubernetes.WorkflowSidecar.delete(this.kubernetesName, this.kubernetesNamespace);
  }
})
export class BuildWorkflowSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ immutable: true, ref: 'BuildSchema', required: true })
  public buildId: Ref<BuildDocument>;

  public createdAt: Date;

  @arrayProp({ items: String })
  public deleted: string[];

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ enum: FilePlatform, required: true })
  public platform: string;

  @prop({ immutable: true, ref: 'BuildSchema', required: true })
  public previousBuildId: Ref<BuildDocument>;

  @prop()
  public status: WorkflowStatusSchema;

  @arrayProp({ items: String })
  public unmodified: string[];

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  public _original: any;
  public get kubernetesEndpoint() {
    return `http://api.default:3000/builds/${this.buildId}/workflows/${this._id}`;
  }
  public get kubernetesName() {
    return `build-workflow-${this._id}`;
  }
  public get kubernetesNamespace() {
    const namespace = new Namespace({ _id: this.namespaceId });
    return `namespace-${namespace.kubernetesNamespace}`;
  }
  public wasModified: string[];
  public wasNew: boolean;
  public get zip() {
    return `/namespaces/${this.namespaceId}/builds/${this.buildId}/archives/${this._id}.zip`;
  }
}

export type BuildWorkflowDocument = DocumentType<BuildWorkflowSchema>;
export type BuildWorkflowModel = ReturnModelType<typeof BuildWorkflowSchema>;

const schema = buildSchema(BuildWorkflowSchema).set('collection', 'buildworkflows');
export const BuildWorkflow = addModelToTypegoose(
  mongoose.model('BuildWorkflowSchema', schema),
  BuildWorkflowSchema,
);
