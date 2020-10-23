import { Context } from '@tenlastic/web-server';

import { UserPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const user = await UserPermissions.create(
    ctx.request.body,
    {},
    ctx.state.apiKey || ctx.state.user,
  );

  // Refresh the User's accessible fields.
  const result = await UserPermissions.findOne({}, { where: { _id: user._id } }, user);

  ctx.response.body = { record: result };
}
