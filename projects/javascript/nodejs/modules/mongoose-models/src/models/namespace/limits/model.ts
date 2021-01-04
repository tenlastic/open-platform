import { DocumentType, ReturnModelType, getModelForClass, prop } from '@hasezoey/typegoose';

import { NamespaceBuildLimitsSchema } from './build';
import { NamespaceCollectionLimitsSchema } from './collection';
import { NamespaceGameLimitsSchema } from './game';
import { NamespaceGameServerLimitsSchema } from './game-server';
import { NamespaceWorkflowLimitsSchema } from './workflow';

export class NamespaceLimitsSchema {
  @prop({ required: true })
  public builds: NamespaceBuildLimitsSchema;

  @prop({ required: true })
  public collections: NamespaceCollectionLimitsSchema;

  @prop({ required: true })
  public gameServers: NamespaceGameServerLimitsSchema;

  @prop({ required: true })
  public games: NamespaceGameLimitsSchema;

  @prop({ required: true })
  public workflows: NamespaceWorkflowLimitsSchema;
}

export type NamespaceLimitsDocument = DocumentType<NamespaceLimitsSchema>;
export type NamespaceLimitsModel = ReturnModelType<typeof NamespaceLimitsSchema>;
export const NamespaceLimits = getModelForClass(NamespaceLimitsSchema);
