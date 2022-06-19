import { NamespaceBuildLimitsMock } from './build';
import { NamespaceDatabaseLimitsMock } from './database';
import { NamespaceGameLimitsMock } from './game';
import { NamespaceGameServerLimitsMock } from './game-server';
import { NamespaceLimits, NamespaceLimitsSchema } from './model';
import { NamespaceQueueLimitsMock } from './queue';
import { NamespaceWorkflowLimitsMock } from './workflow';

export class NamespaceLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceLimitsSchema> = {}) {
    const defaults = {
      builds: NamespaceBuildLimitsMock.create(),
      databases: NamespaceDatabaseLimitsMock.create(),
      gameServers: NamespaceGameServerLimitsMock.create(),
      games: NamespaceGameLimitsMock.create(),
      queues: NamespaceQueueLimitsMock.create(),
      workflows: NamespaceWorkflowLimitsMock.create(),
    };

    return new NamespaceLimits({ ...defaults, ...params });
  }
}
