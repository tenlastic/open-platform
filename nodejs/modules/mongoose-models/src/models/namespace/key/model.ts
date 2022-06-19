import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { NamespaceRole } from '../model';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceKeySchema {
  @prop({ required: true })
  public description: string;

  @prop({ enum: NamespaceRole, type: String })
  public roles: string[];

  @prop({ required: true })
  public value: string;
}

export type NamespaceKeyDocument = DocumentType<NamespaceKeySchema>;
export type NamespaceKeyModel = ReturnModelType<typeof NamespaceKeySchema>;
export const NamespaceKey = getModelForClass(NamespaceKeySchema);
