import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { QueueStatusComponentName, QueueStatusPhase } from '../model';

@modelOptions({ schemaOptions: { _id: false } })
export class QueueStatusComponentSchema {
  @prop({ required: true, type: Number })
  public current: number;

  @prop({ enum: QueueStatusComponentName, required: true, type: String })
  public name: QueueStatusComponentName;

  @prop({ default: () => QueueStatusPhase.Pending, enum: QueueStatusPhase, type: String })
  public phase: QueueStatusPhase;

  @prop({ required: true, type: Number })
  public total: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof QueueStatusComponentModel,
    values: Partial<QueueStatusComponentSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = {
      current: chance.integer({ min: 0 }),
      name: QueueStatusComponentName.Application,
      phase: QueueStatusPhase.Running,
      total: chance.integer({ min: 0 }),
    };

    return new this({ ...defaults, ...values });
  }
}

export type QueueStatusComponentDocument = DocumentType<QueueStatusComponentSchema>;
export const QueueStatusComponentModel = getModelForClass(QueueStatusComponentSchema, {
  existingMongoose: mongoose,
});
