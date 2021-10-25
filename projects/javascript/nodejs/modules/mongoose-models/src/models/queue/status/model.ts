import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { QueueStatusComponentSchema } from './component';
import { QueueStatusNodeSchema } from './node';

export enum QueueStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

@modelOptions({ schemaOptions: { _id: false } })
export class QueueStatusSchema {
  @arrayProp({ items: QueueStatusComponentSchema })
  public components: QueueStatusComponentSchema[];

  @arrayProp({ items: QueueStatusNodeSchema })
  public nodes: QueueStatusNodeSchema[];

  @prop({ enum: QueueStatusPhase, required: true })
  public phase: QueueStatusPhase;

  @prop()
  public version: string;
}

export type QueueStatusDocument = DocumentType<QueueStatusSchema>;
export type QueueStatusModel = ReturnModelType<typeof QueueStatusSchema>;
export const QueueStatus = getModelForClass(QueueStatusSchema);
