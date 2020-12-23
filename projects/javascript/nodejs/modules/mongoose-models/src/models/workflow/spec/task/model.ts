import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { WorkflowSpecTaskArgumentsDocument } from './arguments';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTaskSchema {
  @prop()
  public arguments: WorkflowSpecTaskArgumentsDocument;

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
