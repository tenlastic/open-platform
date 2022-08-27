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
  Provisioner = 'provisioner',
  Sidecar = 'sidecar',
  WebSocketServer = 'wss',
}

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class NamespaceStatusComponentSchema {
  @prop({ required: true })
  public current: number;

  @prop({ enum: NamespaceStatusComponentName, required: true })
  public name: NamespaceStatusComponentName;

  @prop({ enum: NamespaceStatusPhase, required: true })
  public phase: NamespaceStatusPhase;

  @prop({ required: true })
  public total: number;
}

export type NamespaceStatusComponentDocument = DocumentType<NamespaceStatusComponentSchema>;
export type NamespaceStatusComponentModel = ReturnModelType<typeof NamespaceStatusComponentSchema>;
export const NamespaceStatusComponent = getModelForClass(NamespaceStatusComponentSchema);
