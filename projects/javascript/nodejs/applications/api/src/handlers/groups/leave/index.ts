import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Group, GroupPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const where = await GroupPermissions.where({ _id: ctx.params._id }, ctx.state.user);
  const group = await Group.findOne(where).populate(
    GroupPermissions.accessControl.options.populate,
  );
  if (!group) {
    throw new RecordNotFoundError('Group');
  }

  const result = await Group.findOneAndUpdate(
    { _id: ctx.params._id },
    { $pull: { userIds: ctx.state.user._id } },
  );
  const record = await GroupPermissions.read(result, ctx.state.user);

  ctx.response.body = { record };
}
