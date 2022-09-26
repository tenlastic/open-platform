import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { NamespaceStatusComponentSchema } from './component';
import { NamespaceStatusLimitSchema } from './limit';
import { NamespaceStatusNodeSchema } from './node';

export enum NamespaceStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceStatusSchema {
  @prop({ type: NamespaceStatusComponentSchema })
  public components: NamespaceStatusComponentSchema[];

  @prop({ type: NamespaceStatusLimitSchema })
  public limits: NamespaceStatusLimitSchema[];

  @prop({ type: NamespaceStatusNodeSchema })
  public nodes: NamespaceStatusNodeSchema[];

  @prop({ enum: NamespaceStatusPhase, required: true })
  public phase: NamespaceStatusPhase;

  @prop()
  public version: string;
}

export type NamespaceStatusDocument = DocumentType<NamespaceStatusSchema>;
export type NamespaceStatusModel = ReturnModelType<typeof NamespaceStatusSchema>;
export const NamespaceStatus = getModelForClass(NamespaceStatusSchema);
