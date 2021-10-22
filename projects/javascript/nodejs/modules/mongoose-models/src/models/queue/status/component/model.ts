import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { QueueStatusPhase } from '../model';

export enum QueueStatusComponentName {
  Application = 'application',
  Redis = 'redis',
  Sidecar = 'sidecar',
}

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class QueueStatusComponentSchema {
  @prop({ required: true })
  public current: number;

  @prop({ enum: QueueStatusComponentName, required: true })
  public name: QueueStatusComponentName;

  @prop({ enum: QueueStatusPhase, required: true })
  public phase: QueueStatusPhase;

  @prop({ required: true })
  public total: number;
}

export type QueueStatusComponentDocument = DocumentType<QueueStatusComponentSchema>;
export type QueueStatusComponentModel = ReturnModelType<typeof QueueStatusComponentSchema>;
export const QueueStatusComponent = getModelForClass(QueueStatusComponentSchema);
