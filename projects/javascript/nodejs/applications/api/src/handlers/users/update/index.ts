import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { User, UserPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const where = await UserPermissions.where(
    { _id: ctx.params.id },
    ctx.state.apiKey || ctx.state.user,
  );
  const record = await User.findOne(where).populate(UserPermissions.accessControl.options.populate);

  if (!record) {
    throw new RecordNotFoundError('User');
  }

  const result = await UserPermissions.update(
    record,
    ctx.request.body,
    {},
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { record: result };
}
