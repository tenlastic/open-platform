import { Chance } from 'chance';

import { QueueStatusComponentName, QueueStatusPhase } from '../model';
import { QueueStatusNode, QueueStatusNodeSchema } from './model';

const chance = new Chance();

export class QueueStatusNodeMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<QueueStatusNodeSchema> = {}) {
    const defaults = {
      component: QueueStatusComponentName.Application,
      container: chance.hash(),
      phase: QueueStatusPhase.Running,
      pod: chance.hash(),
    };

    return new QueueStatusNode({ ...defaults, ...params });
  }
}
