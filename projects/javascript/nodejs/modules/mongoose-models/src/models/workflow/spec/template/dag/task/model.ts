import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { WorkflowSpecArgumentsSchema } from '../../../arguments';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateDagTaskSchema {
  @prop()
  public arguments: WorkflowSpecArgumentsSchema;

  @prop({ default: undefined, type: String })
  public dependencies: string[];

  @prop({ required: true })
  public name: string;

  @prop({ required: true })
  public template: string;
}

export type WorkflowSpecTemplateDagTaskDocument = DocumentType<WorkflowSpecTemplateDagTaskSchema>;
export type WorkflowSpecTemplateDagTaskModel = ReturnModelType<
  typeof WorkflowSpecTemplateDagTaskSchema
>;
export const WorkflowSpecTemplateDagTask = getModelForClass(WorkflowSpecTemplateDagTaskSchema);
