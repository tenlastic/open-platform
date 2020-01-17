import { Context } from '@tenlastic/web-server';

import { Namespace, NamespacePermissions, UserRoles } from '../../../models';

export async function handler(ctx: Context) {
  const { accessControlList } = ctx.request.body;
  const { user } = ctx.state;

  const override = {
    accessControlList: Namespace.getDefaultAccessControlList(accessControlList, user) as any,
  };

  const result = await NamespacePermissions.create(ctx.request.body, override, ctx.state.user);

  ctx.response.body = { record: result };
}
