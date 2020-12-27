import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { WorkflowSpecArgumentsDocument } from './arguments';
import { WorkflowSpecTemplate, WorkflowSpecTemplateDocument } from './template';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecSchema {
  @prop()
  public arguments: WorkflowSpecArgumentsDocument;

  @prop({ required: true })
  public entrypoint: string;

  @arrayProp({ items: WorkflowSpecTemplate, required: true })
  public templates: WorkflowSpecTemplateDocument[];
}

export type WorkflowSpecDocument = DocumentType<WorkflowSpecSchema>;
export type WorkflowSpecModel = ReturnModelType<typeof WorkflowSpecSchema>;
export const WorkflowSpec = getModelForClass(WorkflowSpecSchema);
