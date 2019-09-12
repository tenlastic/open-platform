import { Context } from '@tenlastic/web-server';

import { NamespacePermissions, UserRoles } from '../../../models';

export async function handler(ctx: Context) {
  const userRoles = new UserRoles({ roles: ['Administrator'], userId: ctx.state.user._id });
  const override = { accessControlList: [userRoles] };
  const result = await NamespacePermissions.create(ctx.request.body, override, ctx.state.user);

  ctx.response.body = { record: result };
}
