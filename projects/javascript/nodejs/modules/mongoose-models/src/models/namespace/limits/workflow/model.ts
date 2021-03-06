import { DocumentType, ReturnModelType, getModelForClass, prop } from '@typegoose/typegoose';

export class NamespaceWorkflowLimitsSchema {
  @prop({ default: 0 })
  public count: number;

  @prop({ default: 0 })
  public cpu: number;

  @prop({ default: 0 })
  public memory: number;

  @prop({ default: 0 })
  public parallelism: number;

  @prop({ default: false })
  public preemptible: boolean;

  @prop({ default: 0 })
  public storage: number;
}

export type NamespaceWorkflowLimitsDocument = DocumentType<NamespaceWorkflowLimitsSchema>;
export type NamespaceWorkflowLimitsModel = ReturnModelType<typeof NamespaceWorkflowLimitsSchema>;
export const NamespaceWorkflowLimits = getModelForClass(NamespaceWorkflowLimitsSchema);
