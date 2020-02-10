import * as mongoose from 'mongoose';

import { FilePlatform } from '../file';
import { ReleaseJob, ReleaseJobSchema, ReleaseJobAction } from './model';

export class ReleaseJobMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<ReleaseJobSchema> = {}) {
    const defaults = {
      action: this.getAction(),
      platform: this.getPlatform(),
      releaseId: mongoose.Types.ObjectId(),
    };

    return ReleaseJob.create({ ...defaults, ...params });
  }

  public static getAction() {
    const values = Object.values(ReleaseJobAction);
    const index = Math.floor(Math.random() * values.length);

    return values[index];
  }

  public static getPlatform() {
    const values = Object.values(FilePlatform);
    const index = Math.floor(Math.random() * values.length);

    return values[index];
  }
}
