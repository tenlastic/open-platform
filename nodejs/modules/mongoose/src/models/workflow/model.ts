import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  prop,
  plugin,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';
import { WorkflowSpecDocument, WorkflowSpecModel, WorkflowSpecSchema } from './spec';
import { WorkflowStatusDocument, WorkflowStatusModel, WorkflowStatusSchema } from './status';

@index({ namespaceId: 1 })
@modelOptions({ schemaOptions: { collection: 'workflows', minimize: false, timestamps: true } })
@plugin(unsetPlugin)
export class WorkflowSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ min: 0, required: true, type: Number })
  public cpu: number;

  public createdAt: Date;

  @prop({ min: 0, required: true, type: Number })
  public memory: number;

  @prop({ maxlength: 64, required: true, trim: true, type: String })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ type: Boolean })
  public preemptible: boolean;

  @prop({ required: true, type: WorkflowSpecSchema })
  public spec: WorkflowSpecDocument;

  @prop({ default: () => new WorkflowStatusModel(), merge: true, type: WorkflowStatusSchema })
  public status: WorkflowStatusDocument;

  @prop({ min: 0, required: true, type: Number })
  public storage: number;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof WorkflowModel, values: Partial<WorkflowSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      cpu: chance.pickone([1, 3, 5]),
      memory: chance.pickone([1, 3, 5]),
      name: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
      spec: WorkflowSpecModel.mock(),
      storage: chance.pickone([1, 3, 5]),
    };

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowDocument = DocumentType<WorkflowSchema>;
export const WorkflowModel = getModelForClass(WorkflowSchema, { existingMongoose: mongoose });
