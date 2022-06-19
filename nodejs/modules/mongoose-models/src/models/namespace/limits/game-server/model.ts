import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

@modelOptions({ schemaOptions: { _id: false } })
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
