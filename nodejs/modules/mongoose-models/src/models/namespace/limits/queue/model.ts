import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
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
