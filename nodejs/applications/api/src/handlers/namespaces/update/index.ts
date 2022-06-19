import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Namespace, NamespacePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const user = ctx.state.user;

  const existing = await NamespacePermissions.findOne({}, { where: { _id: ctx.params._id } }, user);
  if (!existing) {
    throw new RecordNotFoundError();
  }

  const users = ctx.request.body.users || existing.users;
  const override = { users: Namespace.getDefaultUsers(users, ctx.state.user) } as any;

  const result = await NamespacePermissions.update(existing, ctx.request.body, override, user);
  const record = await NamespacePermissions.read(result, user);

  ctx.response.body = { record };
}
