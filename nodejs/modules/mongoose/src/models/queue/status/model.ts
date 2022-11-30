import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import { QueueStatusComponentDocument, QueueStatusComponentSchema } from './component';
import { QueueStatusNodeDocument, QueueStatusNodeSchema } from './node';

export enum QueueStatusComponentName {
  Application = 'Application',
  Sidecar = 'Sidecar',
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
  public components: QueueStatusComponentDocument[];

  @prop({ type: String })
  public message: string;

  @prop({ type: QueueStatusNodeSchema }, PropType.ARRAY)
  public nodes: QueueStatusNodeDocument[];

  @prop({ default: QueueStatusPhase.Pending, enum: QueueStatusPhase, type: String })
  public phase: QueueStatusPhase;

  @prop({ type: String })
  public version: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static create(this: QueueStatusModel, values: Partial<QueueStatusSchema> = {}) {
    const defaults = { phase: QueueStatusPhase.Running };

    return new this({ ...defaults, ...values });
  }
}

export type QueueStatusDocument = DocumentType<QueueStatusSchema>;
export type QueueStatusModel = ReturnModelType<typeof QueueStatusSchema>;
export const QueueStatus = getModelForClass(QueueStatusSchema);
