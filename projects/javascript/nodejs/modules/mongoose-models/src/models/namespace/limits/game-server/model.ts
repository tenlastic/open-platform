import { DocumentType, ReturnModelType, getModelForClass, prop } from '@hasezoey/typegoose';

export class NamespaceGameServerLimitsSchema {
  @prop({ required: true })
  public count: number;

  @prop({ required: true })
  public cpu: number;

  @prop({ required: true })
  public memory: number;
}

export type NamespaceGameServerLimitsDocument = DocumentType<NamespaceGameServerLimitsSchema>;
export type NamespaceGameServerLimitsModel = ReturnModelType<
  typeof NamespaceGameServerLimitsSchema
>;
export const NamespaceGameServerLimits = getModelForClass(NamespaceGameServerLimitsSchema);
