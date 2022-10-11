import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { QueueStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class QueueStatusNodeSchema {
  @prop({ required: true, type: String })
  public _id: string;

  @prop({ enum: QueueStatusPhase, required: true, type: String })
  public phase: QueueStatusPhase;
}

export type QueueStatusNodeDocument = DocumentType<QueueStatusNodeSchema>;
export type QueueStatusNodeModel = ReturnModelType<typeof QueueStatusNodeSchema>;
export const QueueStatusNode = getModelForClass(QueueStatusNodeSchema);
