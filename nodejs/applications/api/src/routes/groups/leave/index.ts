import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Group, GroupPermissions } from '../../../mongodb';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const group = await GroupPermissions.findOne(credentials, { where: { _id: ctx.params._id } }, {});
  if (!group) {
    throw new RecordNotFoundError();
  }

  const result = await Group.findOneAndUpdate(
    { _id: ctx.params._id },
    { $pull: { userIds: ctx.state.user._id } },
  );
  const record = await GroupPermissions.read(credentials, result);

  ctx.response.body = { record };
}
