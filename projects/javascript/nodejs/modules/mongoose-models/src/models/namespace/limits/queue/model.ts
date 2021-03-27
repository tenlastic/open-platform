import { DocumentType, ReturnModelType, getModelForClass, prop } from '@hasezoey/typegoose';

export class NamespaceQueueLimitsSchema {
  @prop({ default: 0 })
  public count: number;

  @prop({ default: 0 })
  public cpu: number;

  @prop({ default: 0 })
  public memory: number;

  @prop({ default: false })
  public preemptible: boolean;
}

export type NamespaceQueueLimitsDocument = DocumentType<NamespaceQueueLimitsSchema>;
export type NamespaceQueueLimitsModel = ReturnModelType<typeof NamespaceQueueLimitsSchema>;
export const NamespaceQueueLimits = getModelForClass(NamespaceQueueLimitsSchema);
