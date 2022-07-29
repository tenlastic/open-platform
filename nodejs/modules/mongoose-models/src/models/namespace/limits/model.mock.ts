import { NamespaceBuildLimitsMock } from './build';
import { NamespaceGameServerLimitsMock } from './game-server';
import { NamespaceLimits, NamespaceLimitsSchema } from './model';
import { NamespaceQueueLimitsMock } from './queue';
import { NamespaceStorefrontLimitsMock } from './storefront';
import { NamespaceWorkflowLimitsMock } from './workflow';

export class NamespaceLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceLimitsSchema> = {}) {
    const defaults = {
      builds: NamespaceBuildLimitsMock.create(),
      gameServers: NamespaceGameServerLimitsMock.create(),
      queues: NamespaceQueueLimitsMock.create(),
      storefronts: NamespaceStorefrontLimitsMock.create(),
      workflows: NamespaceWorkflowLimitsMock.create(),
    };

    return new NamespaceLimits({ ...defaults, ...params });
  }
}
