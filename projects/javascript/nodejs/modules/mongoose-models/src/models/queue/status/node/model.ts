import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { QueueStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false } })
export class QueueStatusNodeSchema {
  @prop({ required: true })
  public name: string;

  @prop({ enum: QueueStatusPhase, required: true })
  public phase: QueueStatusPhase;
}

export type QueueStatusNodeDocument = DocumentType<QueueStatusNodeSchema>;
export type QueueStatusNodeModel = ReturnModelType<typeof QueueStatusNodeSchema>;
export const QueueStatusNode = getModelForClass(QueueStatusNodeSchema);
