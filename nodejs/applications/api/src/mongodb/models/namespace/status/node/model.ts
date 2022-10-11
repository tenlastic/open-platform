import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { NamespaceStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class NamespaceStatusNodeSchema {
  @prop({ required: true, type: String })
  public _id: string;

  @prop({ enum: NamespaceStatusPhase, required: true, type: String })
  public phase: NamespaceStatusPhase;
}

export type NamespaceStatusNodeDocument = DocumentType<NamespaceStatusNodeSchema>;
export type NamespaceStatusNodeModel = ReturnModelType<typeof NamespaceStatusNodeSchema>;
export const NamespaceStatusNode = getModelForClass(NamespaceStatusNodeSchema);
