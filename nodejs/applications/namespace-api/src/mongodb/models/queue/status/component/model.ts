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
  Sidecar = 'sidecar',
}

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class QueueStatusComponentSchema {
  @prop({ required: true, type: Number })
  public current: number;

  @prop({ enum: QueueStatusComponentName, required: true, type: String })
  public name: QueueStatusComponentName;

  @prop({ enum: QueueStatusPhase, required: true, type: String })
  public phase: QueueStatusPhase;

  @prop({ required: true, type: Number })
  public total: number;
}

export type QueueStatusComponentDocument = DocumentType<QueueStatusComponentSchema>;
export type QueueStatusComponentModel = ReturnModelType<typeof QueueStatusComponentSchema>;
export const QueueStatusComponent = getModelForClass(QueueStatusComponentSchema);
