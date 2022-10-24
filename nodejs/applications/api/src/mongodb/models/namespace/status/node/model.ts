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
  @prop({ enum: NamespaceStatusComponentName, required: true, type: String })
  public component: NamespaceStatusComponentName;

  @prop({ required: true, type: String })
  public container: string;

  @prop({ enum: NamespaceStatusPhase, required: true, type: String })
  public phase: NamespaceStatusPhase;

  @prop({ required: true, type: String })
  public pod: string;
}

export type NamespaceStatusNodeDocument = DocumentType<NamespaceStatusNodeSchema>;
export type NamespaceStatusNodeModel = ReturnModelType<typeof NamespaceStatusNodeSchema>;
export const NamespaceStatusNode = getModelForClass(NamespaceStatusNodeSchema);
