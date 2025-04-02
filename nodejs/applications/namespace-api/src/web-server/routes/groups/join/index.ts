import { GroupInvitationPermissions, GroupModel, GroupPermissions } from '@tenlastic/mongoose';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

export async function handler(ctx: Context) {
  const { _id, namespaceId } = ctx.params;
  const credentials = { ...ctx.state };

  const groupInvitation = await GroupInvitationPermissions.findOne(
    credentials,
    { where: { groupId: _id, namespaceId, toUserId: ctx.state.user._id } },
    {},
  );
  if (!groupInvitation) {
    throw new RecordNotFoundError();
  }

  const group = await GroupPermissions.findOne(credentials, { where: ctx.params }, {});
  if (!group) {
    throw new RecordNotFoundError();
  }

  const userId = new mongoose.Types.ObjectId(ctx.state.user._id);
  const userIds = group.userIds.some((ui) => ui.equals(userId))
    ? group.userIds
    : [...group.userIds, userId];

  const result = await GroupModel.findOneAndUpdate(ctx.params, { userIds }, { new: true });
  const record = await GroupPermissions.read(credentials, result);

  ctx.response.body = { record };
}
