import * as mongoose from 'mongoose';

import { GroupInvitation, GroupInvitationSchema } from './model';

export class GroupInvitationMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<GroupInvitationSchema> = {}) {
    const defaults = {
      fromUserId: new mongoose.Types.ObjectId(),
      groupId: new mongoose.Types.ObjectId(),
      toUserId: new mongoose.Types.ObjectId(),
    };

    return GroupInvitation.create({ ...defaults, ...params });
  }
}
