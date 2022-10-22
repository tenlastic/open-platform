import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization';
import { WorkflowSpecSchema } from './spec';
import { WorkflowStatusSchema } from './status';

@index({ namespaceId: 1 })
@modelOptions({ schemaOptions: { collection: 'workflows', minimize: false, timestamps: true } })
export class WorkflowSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ min: 0, required: true, type: Number })
  public cpu: number;

  public createdAt: Date;

  @prop({ min: 0, required: true, type: Number })
  public memory: number;

  @prop({ required: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ type: Boolean })
  public preemptible: boolean;

  @prop({ required: true, type: WorkflowSpecSchema })
  public spec: WorkflowSpecSchema;

  @prop({ merge: true, type: WorkflowStatusSchema })
  public status: WorkflowStatusSchema;

  @prop({ min: 0, required: true, type: Number })
  public storage: number;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];
}

export type WorkflowDocument = DocumentType<WorkflowSchema>;
export type WorkflowModel = ReturnModelType<typeof WorkflowSchema>;
export const Workflow = getModelForClass(WorkflowSchema);
