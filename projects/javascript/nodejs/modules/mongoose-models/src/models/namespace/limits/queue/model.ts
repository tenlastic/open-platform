import { DocumentType, ReturnModelType, getModelForClass, prop } from '@typegoose/typegoose';

export class NamespaceQueueLimitsSchema {
  @prop({ default: 0 })
  public cpu: number;

  @prop({ default: 0 })
  public memory: number;

  @prop({ default: false })
  public preemptible: boolean;

  @prop({ default: 0 })
  public replicas: number;
}

export type NamespaceQueueLimitsDocument = DocumentType<NamespaceQueueLimitsSchema>;
export type NamespaceQueueLimitsModel = ReturnModelType<typeof NamespaceQueueLimitsSchema>;
export const NamespaceQueueLimits = getModelForClass(NamespaceQueueLimitsSchema);
