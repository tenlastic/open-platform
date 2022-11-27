import { UserPermissions } from '@tenlastic/mongoose';
import { Context } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const user = await UserPermissions.create(credentials, {}, ctx.request.body);

  // Refresh the User's accessible fields.
  const result = await UserPermissions.findOne(credentials, { where: { _id: user._id } }, {});
  const record = await UserPermissions.read(credentials, result);

  ctx.response.body = { record };
}
