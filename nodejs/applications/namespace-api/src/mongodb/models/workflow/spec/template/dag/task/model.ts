import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

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
}

export type WorkflowSpecTemplateDagTaskDocument = DocumentType<WorkflowSpecTemplateDagTaskSchema>;
export type WorkflowSpecTemplateDagTaskModel = ReturnModelType<
  typeof WorkflowSpecTemplateDagTaskSchema
>;
export const WorkflowSpecTemplateDagTask = getModelForClass(WorkflowSpecTemplateDagTaskSchema);
