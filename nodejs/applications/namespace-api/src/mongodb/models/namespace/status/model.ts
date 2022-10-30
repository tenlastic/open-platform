import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';

import { NamespaceStatusLimitsSchema } from './limits';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceStatusSchema {
  @prop({ type: NamespaceStatusLimitsSchema })
  public limits: NamespaceStatusLimitsSchema;
}

export type NamespaceStatusDocument = DocumentType<NamespaceStatusSchema>;
export type NamespaceStatusModel = ReturnModelType<typeof NamespaceStatusSchema>;
export const NamespaceStatus = getModelForClass(NamespaceStatusSchema);
