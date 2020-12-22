import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTaskSchema {
  @arrayProp({ default: undefined, items: String })
  public dependencies: string[];

  @prop({ required: true })
  public name: string;

  @prop({ required: true })
  public template: string;
}

export type WorkflowSpecTaskDocument = DocumentType<WorkflowSpecTaskSchema>;
export type WorkflowSpecTaskModel = ReturnModelType<typeof WorkflowSpecTaskSchema>;
export const WorkflowSpecTask = getModelForClass(WorkflowSpecTaskSchema);
