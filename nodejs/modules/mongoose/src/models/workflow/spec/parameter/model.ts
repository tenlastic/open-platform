import { DocumentType, getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecParameterSchema {
  @prop({ required: true, type: String })
  public name: string;

  @prop({ required: true, type: String })
  public value: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof WorkflowSpecParameterModel,
    values: Partial<WorkflowSpecParameterSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = { name: chance.hash(), value: chance.hash() };

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowSpecParameterDocument = DocumentType<WorkflowSpecParameterSchema>;
export const WorkflowSpecParameterModel = getModelForClass(WorkflowSpecParameterSchema, {
  existingMongoose: mongoose,
});
