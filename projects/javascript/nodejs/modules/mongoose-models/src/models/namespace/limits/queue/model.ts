import { DocumentType, ReturnModelType, getModelForClass, prop } from '@hasezoey/typegoose';

export class NamespaceQueueLimitsSchema {
  @prop({ default: 0 })
  public count: number;
}

export type NamespaceQueueLimitsDocument = DocumentType<NamespaceQueueLimitsSchema>;
export type NamespaceQueueLimitsModel = ReturnModelType<typeof NamespaceQueueLimitsSchema>;
export const NamespaceQueueLimits = getModelForClass(NamespaceQueueLimitsSchema);
