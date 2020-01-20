import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { File, FilePlatform, FileSchema } from './model';

export class FileMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<FileSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      md5: chance.hash(),
      path: chance.hash(),
      platform: this.getPlatform(),
      releaseId: mongoose.Types.ObjectId(),
    };

    return File.create({ ...defaults, ...params });
  }

  public static getPlatform() {
    const values = Object.values(FilePlatform);
    const index = Math.floor(Math.random() * values.length);

    return values[index];
  }
}
