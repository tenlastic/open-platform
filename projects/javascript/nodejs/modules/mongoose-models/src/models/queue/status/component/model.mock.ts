import { Chance } from 'chance';

import { QueueStatusPhase } from '../model';
import {
  QueueStatusComponent,
  QueueStatusComponentName,
  QueueStatusComponentSchema,
} from './model';

export class QueueStatusComponentMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<QueueStatusComponentSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      current: chance.integer({ min: 0 }),
      name: QueueStatusComponentName.Application,
      phase: QueueStatusPhase.Running,
      total: chance.integer({ min: 0 }),
    };

    return new QueueStatusComponent({ ...defaults, ...params });
  }
}
