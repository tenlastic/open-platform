import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { EventEmitter, IDatabasePayload, changeStreamPlugin } from '../../change-stream';
import { Namespace, NamespaceDocument, NamespaceEvent, NamespaceLimitError } from '../namespace';
import { WorkflowSpecSchema } from './spec';
import { WorkflowStatusSchema } from './status';

export const WorkflowEvent = new EventEmitter<IDatabasePayload<WorkflowDocument>>();

// Delete Workflows if associated Namespace is deleted.
NamespaceEvent.sync(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Workflow.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
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

  @prop({ min: 0, required: true })
  public cpu: number;

  public createdAt: Date;

  @prop({ min: 0, required: true })
  public memory: number;

  @prop({ immutable: true, required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ immutable: true })
  public preemptible: boolean;

  @prop({ immutable: true, required: true })
  public spec: WorkflowSpecSchema;

  @prop()
  public status: WorkflowStatusSchema;

  @prop({ min: 0, required: true })
  public storage: number;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;

  /**
   * Throws an error if a NamespaceLimit is exceeded.
   */
  public static async checkNamespaceLimits(
    cpu: number,
    memory: number,
    namespaceId: string | mongoose.Types.ObjectId,
    parallelism: number,
    preemptible: boolean,
    storage: number,
  ) {}
}

export type WorkflowDocument = DocumentType<WorkflowSchema>;
export type WorkflowModel = ReturnModelType<typeof WorkflowSchema>;
export const Workflow = getModelForClass(WorkflowSchema);
