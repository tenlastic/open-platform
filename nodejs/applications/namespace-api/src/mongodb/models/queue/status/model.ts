import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import { QueueStatusComponentSchema } from './component';
import { QueueStatusNodeSchema } from './node';

export enum QueueStatusComponentName {
  Application = 'application',
  Sidecar = 'sidecar',
}

export enum QueueStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

@modelOptions({ schemaOptions: { _id: false } })
export class QueueStatusSchema {
  @prop({ type: QueueStatusComponentSchema }, PropType.ARRAY)
  public components: QueueStatusComponentSchema[];

  @prop({ type: QueueStatusNodeSchema }, PropType.ARRAY)
  public nodes: QueueStatusNodeSchema[];

  @prop({ enum: QueueStatusPhase, required: true, type: String })
  public phase: QueueStatusPhase;

  @prop({ type: String })
  public version: string;
}

export type QueueStatusDocument = DocumentType<QueueStatusSchema>;
export type QueueStatusModel = ReturnModelType<typeof QueueStatusSchema>;
export const QueueStatus = getModelForClass(QueueStatusSchema);
