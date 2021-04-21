import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Build, BuildPlatform, BuildSchema } from './model';

export class BuildMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<BuildSchema> = {}) {
    const record = await this.new(params);
    return record.save();
  }

  /**
   * Gets a random BuildPlatform.
   */
  public static getPlatform() {
    const values = Object.values(BuildPlatform);
    const index = Math.floor(Math.random() * values.length);

    return values[index];
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async new(params: Partial<BuildSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      entrypoint: chance.hash(),
      name: chance.hash(),
      namespaceId: mongoose.Types.ObjectId(),
      platform: this.getPlatform(),
    };

    return new Build({ ...defaults, ...params });
  }
}
