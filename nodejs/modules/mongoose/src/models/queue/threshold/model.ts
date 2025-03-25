import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';
import { Chance } from 'chance';

import { arrayLengthValidator, arrayMaxMinValidator } from '../../../validators';

@modelOptions({ schemaOptions: { _id: false } })
export class QueueThresholdSchema {
  @prop({ type: Number })
  public rating: number;

  @prop({ default: 0, type: Number })
  public seconds: number;

  @prop(
    {
      required: true,
      type: Number,
      validate: [arrayLengthValidator(Infinity, 1), arrayMaxMinValidator(Infinity, 1)],
    },
    PropType.ARRAY,
  )
  public usersPerTeam: number[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof QueueThresholdModel, values: Partial<QueueThresholdSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      usersPerTeam: [chance.integer({ max: 10, min: 1 }), chance.integer({ max: 10, min: 1 })],
    };

    return new this({ ...defaults, ...values });
  }
}

export type QueueThresholdDocument = DocumentType<QueueThresholdSchema>;
export const QueueThresholdModel = getModelForClass(QueueThresholdSchema);
