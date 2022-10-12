import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { NamespaceStatusComponentName, NamespaceStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class NamespaceStatusNodeSchema {
  @prop({ required: true, type: String })
  public _id: string;

  @prop({ enum: NamespaceStatusComponentName, required: true, type: String })
  public component: NamespaceStatusComponentName;

  @prop({ enum: NamespaceStatusPhase, required: true, type: String })
  public phase: NamespaceStatusPhase;
}

export type NamespaceStatusNodeDocument = DocumentType<NamespaceStatusNodeSchema>;
export type NamespaceStatusNodeModel = ReturnModelType<typeof NamespaceStatusNodeSchema>;
export const NamespaceStatusNode = getModelForClass(NamespaceStatusNodeSchema);
