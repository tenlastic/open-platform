import { Context } from '@tenlastic/web-server';

import { UserPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await UserPermissions.create(ctx.request.body, {}, ctx.state.user);

  // Refresh the User's accessible fields.
  const user = await UserPermissions.findOne({}, { where: { _id: result._id } }, ctx.state.user);

  ctx.response.body = { record: user };
}
