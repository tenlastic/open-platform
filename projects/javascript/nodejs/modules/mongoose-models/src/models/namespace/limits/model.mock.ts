import { NamespaceBuildLimitsMock } from './build';
import { NamespaceCollectionLimitsMock } from './collection';
import { NamespaceGameLimitsMock } from './game';
import { NamespaceGameServerLimitsMock } from './game-server';
import { NamespaceLimits, NamespaceLimitsSchema } from './model';
import { NamespaceWorkflowLimitsMock } from './workflow';

export class NamespaceLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceLimitsSchema> = {}) {
    const defaults = {
      builds: NamespaceBuildLimitsMock.create(),
      collections: NamespaceCollectionLimitsMock.create(),
      gameServers: NamespaceGameServerLimitsMock.create(),
      games: NamespaceGameLimitsMock.create(),
      workflows: NamespaceWorkflowLimitsMock.create(),
    };

    return new NamespaceLimits({ ...defaults, ...params });
  }
}
