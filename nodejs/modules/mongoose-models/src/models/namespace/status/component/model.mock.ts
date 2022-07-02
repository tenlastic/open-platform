import { Chance } from 'chance';

import { Phase } from '../model';
import { Component, ComponentName, ComponentSchema } from './model';

export class ComponentMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<ComponentSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      current: chance.integer({ min: 0 }),
      name: ComponentName.Api,
      phase: Phase.Running,
      total: chance.integer({ min: 0 }),
    };

    return new Component({ ...defaults, ...params });
  }
}
