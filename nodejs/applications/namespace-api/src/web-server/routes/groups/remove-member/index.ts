import { GroupModel, GroupPermissions } from '@tenlastic/mongoose';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { _id, groupId, namespaceId } = ctx.params;
  const credentials = { ...ctx.state };
  const group = await GroupPermissions.findOne(
    credentials,
    { where: { _id: groupId, namespaceId } },
    {},
  );
  if (!group) {
    throw new RecordNotFoundError();
  }

  // If the User is not the leader and they are not removing themself, throw an error.
  const member = group.members.find((m) => m._id.equals(_id));
  const leader = group.members[0];
  if (!leader?.userId.equals(ctx.state.user._id) && !member?.userId.equals(ctx.state.user._id)) {
    throw new PermissionError();
  }

  const result = await GroupModel.findOneAndUpdate(
    { _id: groupId, namespaceId },
    { $pull: { members: { _id } } },
    { new: true },
  );
  const record = await GroupPermissions.read(credentials, result);

  ctx.response.body = { record };
}
