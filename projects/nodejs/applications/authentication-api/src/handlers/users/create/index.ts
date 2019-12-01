import { Context } from '@tenlastic/web-server';

import { UserPermissions } from '../../../models';

export async function handler(ctx: Context) {
  console.log('Creating User');
  console.log('Body:', ctx.request.body);
  console.log('User:', ctx.state.user);
  const user = await UserPermissions.create(ctx.request.body, {}, ctx.state.user);
  console.log('Created User:', user);

  // Refresh the User's accessible fields.
  const result = await UserPermissions.findOne({}, { where: { _id: user._id } }, user);
  console.log('Refreshed User:', result);

  ctx.response.body = { record: result };
}
