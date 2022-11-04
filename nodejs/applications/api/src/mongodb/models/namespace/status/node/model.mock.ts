import { Chance } from 'chance';

import { NamespaceStatusComponentName, NamespaceStatusPhase } from '../model';
import { NamespaceStatusNode, NamespaceStatusNodeSchema } from './model';

const chance = new Chance();

export class NamespaceStatusNodeMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceStatusNodeSchema> = {}) {
    const defaults = {
      component: NamespaceStatusComponentName.API,
      container: chance.hash(),
      phase: NamespaceStatusPhase.Running,
      pod: chance.hash(),
    };

    return new NamespaceStatusNode({ ...defaults, ...params });
  }
}
