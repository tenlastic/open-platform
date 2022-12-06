import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Chance } from 'chance';

@modelOptions({ schemaOptions: { _id: false } })
export class QueueThresholdSchema {
  @prop({ min: 1, required: true, type: Number })
  public seconds: number;

  @prop({ min: 1, required: true, type: Number })
  public teams: number;

  @prop({ min: 1, required: true, type: Number })
  public usersPerTeam: number;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof QueueThresholdModel, values: Partial<QueueThresholdSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      seconds: chance.integer({ max: 300, min: 1 }),
      teams: chance.integer({ max: 10, min: 1 }),
      usersPerTeam: chance.integer({ max: 10, min: 1 }),
    };

    return new this({ ...defaults, ...values });
  }
}

export type QueueThresholdDocument = DocumentType<QueueThresholdSchema>;
export const QueueThresholdModel = getModelForClass(QueueThresholdSchema);
