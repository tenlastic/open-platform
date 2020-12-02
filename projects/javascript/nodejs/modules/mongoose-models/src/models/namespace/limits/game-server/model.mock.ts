import { NamespaceGameServerLimits, NamespaceGameServerLimitsSchema } from './model';

export class NamespaceGameServerLimitsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceGameServerLimitsSchema> = {}) {
    const defaults = {};

    return new NamespaceGameServerLimits({ ...defaults, ...params });
  }
}
