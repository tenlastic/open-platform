import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Namespace, NamespacePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const where = await NamespacePermissions.where(
    { _id: ctx.params.id },
    ctx.state.apiKey || ctx.state.user,
  );
  const record = await Namespace.findOne(where).populate(
    NamespacePermissions.accessControl.options.populate,
  );

  if (!record) {
    throw new RecordNotFoundError('Namespace');
  }

  const users = ctx.request.body.users || record.users;
  const override = { users: Namespace.getDefaultUsers(users, ctx.state.user) } as any;

  const result = await NamespacePermissions.update(
    record,
    ctx.request.body,
    override,
    ctx.state.user,
  );

  ctx.response.body = { record: result };
}
