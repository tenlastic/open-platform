import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Group, GroupPermissions } from '../../../mongodb';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const group = await GroupPermissions.findOne(credentials, { where: { _id: ctx.params._id } }, {});
  if (!group) {
    throw new RecordNotFoundError();
  }

  // If the user is not the leader, throw an error.
  if (!group.userIds[0].equals(ctx.state.user._id)) {
    throw new PermissionError();
  }

  const result = await Group.findOneAndUpdate(
    { _id: ctx.params._id },
    { $pull: { userIds: ctx.params.userId } },
    { new: true },
  );
  const record = await GroupPermissions.read(credentials, result);

  ctx.response.body = { record };
}
