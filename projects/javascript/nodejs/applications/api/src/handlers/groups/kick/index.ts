import { PermissionError } from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Group, GroupPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const group = await GroupPermissions.findOne({}, { where: { _id: ctx.params._id } }, user);
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
  );
  const record = await GroupPermissions.read(result, user);

  ctx.response.body = { record };
}
