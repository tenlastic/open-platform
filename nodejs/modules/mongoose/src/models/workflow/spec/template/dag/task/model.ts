import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';
import { Chance } from 'chance';

import { WorkflowSpecArgumentsSchema } from '../../../arguments';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateDagTaskSchema {
  @prop({ WorkflowSpecArgumentsSchema })
  public arguments: WorkflowSpecArgumentsSchema;

  @prop({ default: undefined, type: String }, PropType.ARRAY)
  public dependencies: string[];

  @prop({ required: true, type: String })
  public name: string;

  @prop({ required: true, type: String })
  public template: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: WorkflowSpecTemplateDagTaskModel,
    values: Partial<WorkflowSpecTemplateDagTaskSchema> = {},
  ) {
    const chance = new Chance();
    const defaults = { name: chance.hash(), template: chance.hash() };

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowSpecTemplateDagTaskDocument = DocumentType<WorkflowSpecTemplateDagTaskSchema>;
export type WorkflowSpecTemplateDagTaskModel = ReturnModelType<
  typeof WorkflowSpecTemplateDagTaskSchema
>;
export const WorkflowSpecTemplateDagTask = getModelForClass(WorkflowSpecTemplateDagTaskSchema);
