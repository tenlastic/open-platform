import { Chance } from 'chance';

import { DatabaseStatusPhase } from '../model';
import {
  DatabaseStatusComponent,
  DatabaseStatusComponentName,
  DatabaseStatusComponentSchema,
} from './model';

export class DatabaseStatusComponentMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<DatabaseStatusComponentSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      current: chance.integer({ min: 0 }),
      name: DatabaseStatusComponentName.Application,
      phase: DatabaseStatusPhase.Running,
      total: chance.integer({ min: 0 }),
    };

    return new DatabaseStatusComponent({ ...defaults, ...params });
  }
}
