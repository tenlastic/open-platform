import { DocumentType, ReturnModelType, getModelForClass, prop } from '@hasezoey/typegoose';

import { NamespaceCollectionLimitsDocument } from './collection';
import { NamespaceGameLimitsDocument } from './game';
import { NamespaceGameServerLimitsDocument } from './game-server';
import { NamespaceReleaseLimitsDocument } from './release';

export class NamespaceLimitsSchema {
  @prop({ required: true })
  public collections: NamespaceCollectionLimitsDocument;

  @prop({ required: true })
  public gameServers: NamespaceGameServerLimitsDocument;

  @prop({ required: true })
  public games: NamespaceGameLimitsDocument;

  @prop({ required: true })
  public releases: NamespaceReleaseLimitsDocument;
}

export type NamespaceLimitsDocument = DocumentType<NamespaceLimitsSchema>;
export type NamespaceLimitsModel = ReturnModelType<typeof NamespaceLimitsSchema>;
export const NamespaceLimits = getModelForClass(NamespaceLimitsSchema);
