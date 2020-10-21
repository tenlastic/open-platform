import { Context } from '@tenlastic/web-server';

import { Namespace, NamespacePermissions, NamespaceRoles } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const { accessControlList } = ctx.request.body;
  const { user } = ctx.state;

  const override: any =
    !ctx.request.body.accessControlList || ctx.request.body.accessControlList.length === 0
      ? { accessControlList: Namespace.getDefaultAccessControlList(accessControlList, user) }
      : {};

  const result = await NamespacePermissions.create(ctx.request.body, override, ctx.state.user);

  ctx.response.body = { record: result };
}
