import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowSpecTemplateResourcesSchema {
  @prop()
  public cpu: number;

  @prop()
  public memory: number;
}

export type WorkflowSpecTemplateResourcesDocument = DocumentType<
  WorkflowSpecTemplateResourcesSchema
>;
export type WorkflowSpecTemplateResourcesModel = ReturnModelType<
  typeof WorkflowSpecTemplateResourcesSchema
>;
export const WorkflowSpecTemplateResources = getModelForClass(WorkflowSpecTemplateResourcesSchema);
