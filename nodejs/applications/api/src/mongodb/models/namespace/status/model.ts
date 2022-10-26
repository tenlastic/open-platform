import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import { NamespaceStatusComponentSchema } from './component';
import { NamespaceStatusLimitsSchema } from './limits';
import { NamespaceStatusNodeSchema } from './node';

export enum NamespaceStatusComponentName {
  Api = 'api',
  Cdc = 'cdc',
  Connector = 'connector',
  Metrics = 'metrics',
  Sidecar = 'sidecar',
}

export enum NamespaceStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceStatusSchema {
  @prop({ type: NamespaceStatusComponentSchema }, PropType.ARRAY)
  public components: NamespaceStatusComponentSchema[];

  @prop({ type: NamespaceStatusLimitsSchema })
  public limits: NamespaceStatusLimitsSchema;

  @prop({ type: NamespaceStatusNodeSchema }, PropType.ARRAY)
  public nodes: NamespaceStatusNodeSchema[];

  @prop({ enum: NamespaceStatusPhase, required: true, type: String })
  public phase: NamespaceStatusPhase;

  @prop({ type: String })
  public version: string;
}

export type NamespaceStatusDocument = DocumentType<NamespaceStatusSchema>;
export type NamespaceStatusModel = ReturnModelType<typeof NamespaceStatusSchema>;
export const NamespaceStatus = getModelForClass(NamespaceStatusSchema);
