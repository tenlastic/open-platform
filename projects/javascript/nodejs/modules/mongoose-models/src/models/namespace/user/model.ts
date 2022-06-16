import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { NamespaceRole } from '../model';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceUserSchema {
  @prop({ required: true })
  public _id: mongoose.Types.ObjectId;

  @prop({ enum: NamespaceRole, type: String })
  public roles: string[];
}

export type NamespaceUserDocument = DocumentType<NamespaceUserSchema>;
export type NamespaceUserModel = ReturnModelType<typeof NamespaceUserSchema>;
export const NamespaceUser = getModelForClass(NamespaceUserSchema);
