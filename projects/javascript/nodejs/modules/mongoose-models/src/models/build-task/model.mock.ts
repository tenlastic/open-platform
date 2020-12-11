import * as mongoose from 'mongoose';

import { FilePlatform } from '../file';
import { BuildTask, BuildTaskSchema, BuildTaskAction } from './model';

export class BuildTaskMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<BuildTaskSchema> = {}) {
    const defaults = {
      action: this.getAction(),
      buildId: mongoose.Types.ObjectId(),
      namespaceId: mongoose.Types.ObjectId(),
      platform: this.getPlatform(),
    };

    return BuildTask.create({ ...defaults, ...params });
  }

  public static getAction() {
    const values = Object.values(BuildTaskAction);
    const index = Math.floor(Math.random() * values.length);

    return values[index];
  }

  public static getPlatform() {
    const values = Object.values(FilePlatform);
    const index = Math.floor(Math.random() * values.length);

    return values[index];
  }
}
