import * as Chance from 'chance';

import { BuildFile, BuildFileSchema } from './model';

export class BuildFileMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<BuildFileSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      compressedBytes: chance.integer(),
      md5: chance.hash(),
      path: chance.hash(),
      uncompressedBytes: chance.integer(),
    };

    return new BuildFile({ ...defaults, ...params });
  }
}
