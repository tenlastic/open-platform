import { GroupModel, GroupPermissions } from '@tenlastic/mongoose';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { _id, groupId, namespaceId } = ctx.params;
  const credentials = { ...ctx.state };
  const where = { where: { _id: groupId, namespaceId } };

  const group = await GroupPermissions.findOne(credentials, { where }, {});
  if (!group) {
    throw new RecordNotFoundError();
  }

  // If the User is not the leader and is not removing themselves throw an error.
  const isLeader = group.userId.equals(ctx.state.user._id);
  const isMember = group.userIds.some((ui) => ui.equals(ctx.state.user._id));
  if (!isLeader && (!isMember || _id !== ctx.state.user._id)) {
    throw new PermissionError();
  }

  const userIds = group.userIds.filter((ui) => !ui.equals(_id));
  const userId = group.userId.equals(_id) ? userIds[0] || null : group.userId;

  const result = await GroupModel.findOneAndUpdate(where, { userId, userIds }, { new: true });
  const record = await GroupPermissions.read(credentials, result);

  ctx.response.body = { record };
}
