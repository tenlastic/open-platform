import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';
import { Chance } from 'chance';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecEnvSchema {
  @prop({ required: true, type: String, validate: (v) => /[A-Z0-9_]+/.test(v) })
  public name: string;

  @prop({ required: true, type: String })
  public value: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: WorkflowSpecEnvModel, values: Partial<WorkflowSpecEnvSchema> = {}) {
    const chance = new Chance();
    const defaults = { name: chance.hash(), value: chance.hash() };

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowSpecEnvDocument = DocumentType<WorkflowSpecEnvSchema>;
export type WorkflowSpecEnvModel = ReturnModelType<typeof WorkflowSpecEnvSchema>;
export const WorkflowSpecEnv = getModelForClass(WorkflowSpecEnvSchema);
