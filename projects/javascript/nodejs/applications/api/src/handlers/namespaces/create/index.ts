import { Context } from '@tenlastic/web-server';

import { Namespace, NamespacePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const { users } = ctx.request.body;
  const { user } = ctx.state;

  const override = { users: Namespace.getDefaultUsers(users, user) } as any;

  const result = await NamespacePermissions.create(ctx.request.body, override, user);
  const record = await NamespacePermissions.read(result, user);

  ctx.response.body = { record };
}
