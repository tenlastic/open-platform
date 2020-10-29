import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Group, GroupPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const user = ctx.state.apiKey || ctx.state.user;

  const group = await GroupPermissions.findOne({}, { where: { _id: ctx.params._id } }, user);
  if (!group) {
    throw new RecordNotFoundError();
  }

  const result = await Group.findOneAndUpdate(
    { _id: ctx.params._id },
    { $pull: { userIds: ctx.state.user._id } },
  );
  const record = await GroupPermissions.read(result, user);

  ctx.response.body = { record };
}
