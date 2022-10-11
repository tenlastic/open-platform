import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { NamespaceStatusPhase } from '../model';

export enum NamespaceStatusComponentName {
  Api = 'api',
  Connectors = 'connectors',
  Sidecar = 'sidecar',
}

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class NamespaceStatusComponentSchema {
  @prop({ required: true, type: Number })
  public current: number;

  @prop({ enum: NamespaceStatusComponentName, required: true, type: String })
  public name: NamespaceStatusComponentName;

  @prop({ enum: NamespaceStatusPhase, required: true, type: String })
  public phase: NamespaceStatusPhase;

  @prop({ required: true, type: Number })
  public total: number;
}

export type NamespaceStatusComponentDocument = DocumentType<NamespaceStatusComponentSchema>;
export type NamespaceStatusComponentModel = ReturnModelType<typeof NamespaceStatusComponentSchema>;
export const NamespaceStatusComponent = getModelForClass(NamespaceStatusComponentSchema);
