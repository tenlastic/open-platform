import { DocumentType, ReturnModelType, getModelForClass, prop } from '@typegoose/typegoose';

export class NamespaceGameServerLimitsSchema {
  @prop({ default: 0 })
  public cpu: number;

  @prop({ default: 0 })
  public memory: number;

  @prop({ default: false })
  public preemptible: boolean;
}

export type NamespaceGameServerLimitsDocument = DocumentType<NamespaceGameServerLimitsSchema>;
export type NamespaceGameServerLimitsModel = ReturnModelType<
  typeof NamespaceGameServerLimitsSchema
>;
export const NamespaceGameServerLimits = getModelForClass(NamespaceGameServerLimitsSchema);
