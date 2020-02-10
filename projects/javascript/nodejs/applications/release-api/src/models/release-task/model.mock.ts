import * as mongoose from 'mongoose';

import { FilePlatform } from '../file';
import { ReleaseTask, ReleaseTaskSchema, ReleaseTaskAction } from './model';

export class ReleaseTaskMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<ReleaseTaskSchema> = {}) {
    const defaults = {
      action: this.getAction(),
      platform: this.getPlatform(),
      releaseId: mongoose.Types.ObjectId(),
    };

    return ReleaseTask.create({ ...defaults, ...params });
  }

  public static getAction() {
    const values = Object.values(ReleaseTaskAction);
    const index = Math.floor(Math.random() * values.length);

    return values[index];
  }

  public static getPlatform() {
    const values = Object.values(FilePlatform);
    const index = Math.floor(Math.random() * values.length);

    return values[index];
  }
}
