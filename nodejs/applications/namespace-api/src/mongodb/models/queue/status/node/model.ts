import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { QueueStatusComponentName, QueueStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class QueueStatusNodeSchema {
  @prop({ enum: QueueStatusComponentName, required: true, type: String })
  public component: QueueStatusComponentName;

  @prop({ require: true, type: String })
  public container: string;

  @prop({ enum: QueueStatusPhase, required: true, type: String })
  public phase: QueueStatusPhase;

  @prop({ required: true, type: String })
  public pod: string;
}

export type QueueStatusNodeDocument = DocumentType<QueueStatusNodeSchema>;
export type QueueStatusNodeModel = ReturnModelType<typeof QueueStatusNodeSchema>;
export const QueueStatusNode = getModelForClass(QueueStatusNodeSchema);
