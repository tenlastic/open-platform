import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { WorkflowSpecArgumentsSchema } from '../../../arguments';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateDagTaskSchema {
  @prop()
  public arguments: WorkflowSpecArgumentsSchema;

  @arrayProp({ default: undefined, items: String })
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
