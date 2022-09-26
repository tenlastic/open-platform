import { Chance } from 'chance';

import { NamespaceStatusPhase } from '../model';
import {
  NamespaceStatusComponent,
  NamespaceStatusComponentName,
  NamespaceStatusComponentSchema,
} from './model';

export class NamespaceStatusComponentMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceStatusComponentSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      current: chance.integer({ min: 0 }),
      name: NamespaceStatusComponentName.Api,
      phase: NamespaceStatusPhase.Running,
      total: chance.integer({ min: 0 }),
    };

    return new NamespaceStatusComponent({ ...defaults, ...params });
  }
}
