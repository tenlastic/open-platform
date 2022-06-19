import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { NamespaceBuildLimitsSchema } from './build';
import { NamespaceDatabaseLimitsSchema } from './database';
import { NamespaceGameLimitsSchema } from './game';
import { NamespaceGameServerLimitsSchema } from './game-server';
import { NamespaceQueueLimitsSchema } from './queue';
import { NamespaceWorkflowLimitsSchema } from './workflow';

@modelOptions({ schemaOptions: { _id: false } })
export class NamespaceLimitsSchema {
  @prop({ required: true })
  public builds: NamespaceBuildLimitsSchema;

  @prop({ required: true })
  public databases: NamespaceDatabaseLimitsSchema;

  @prop({ required: true })
  public gameServers: NamespaceGameServerLimitsSchema;

  @prop({ required: true })
  public games: NamespaceGameLimitsSchema;

  @prop({ required: true })
  public queues: NamespaceQueueLimitsSchema;

  @prop({ required: true })
  public workflows: NamespaceWorkflowLimitsSchema;
}

export type NamespaceLimitsDocument = DocumentType<NamespaceLimitsSchema>;
export type NamespaceLimitsModel = ReturnModelType<typeof NamespaceLimitsSchema>;
export const NamespaceLimits = getModelForClass(NamespaceLimitsSchema);
