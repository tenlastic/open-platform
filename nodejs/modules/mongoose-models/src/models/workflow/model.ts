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

import { changeStreamPlugin, EventEmitter, IDatabasePayload } from '../../change-stream';
import { AuthorizationDocument } from '../authorization';
import { NamespaceDocument } from '../namespace';
import { WorkflowSpecSchema } from './spec';
import { WorkflowStatusSchema } from './status';

export const OnWorkflowProduced = new EventEmitter<IDatabasePayload<WorkflowDocument>>();

@index({ namespaceId: 1 })
@modelOptions({ schemaOptions: { collection: 'workflows', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnWorkflowProduced })
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

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;
}

export type WorkflowDocument = DocumentType<WorkflowSchema>;
export type WorkflowModel = ReturnModelType<typeof WorkflowSchema>;
export const Workflow = getModelForClass(WorkflowSchema);
