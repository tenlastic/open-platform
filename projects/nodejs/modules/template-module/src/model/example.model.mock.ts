import * as Chance from 'chance';

import { Example, ExampleSchema } from './example.model';

export class ExampleMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<ExampleSchema> = {}) {
    const chance = new Chance();

    const defaults = {};

    return Example.create({ ...defaults, ...params });
  }
}
