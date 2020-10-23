import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Group, GroupPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const where = await GroupPermissions.where(
    { _id: ctx.params._id },
    ctx.state.apiKey || ctx.state.user,
  );
  const record = await Group.findOne(where).populate(
    GroupPermissions.accessControl.options.populate,
  );
  if (!record) {
    throw new RecordNotFoundError('Group');
  }

  const result = await GroupPermissions.delete(record, ctx.state.apiKey || ctx.state.user);

  ctx.response.body = { record: result };
}
