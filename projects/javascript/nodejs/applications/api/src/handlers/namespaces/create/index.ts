import { Context } from '@tenlastic/web-server';

import { Namespace, NamespacePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const { users } = ctx.request.body;
  const override = { users: Namespace.getDefaultUsers(users, ctx.state.user) } as any;

  const result = await NamespacePermissions.create(
    ctx.request.body,
    override,
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { record: result };
}
