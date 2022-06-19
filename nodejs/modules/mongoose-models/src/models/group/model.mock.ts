import { Group, GroupSchema } from './model';

export class GroupMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<GroupSchema> = {}) {
    const defaults = {};

    return Group.create({ ...defaults, ...params });
  }
}
