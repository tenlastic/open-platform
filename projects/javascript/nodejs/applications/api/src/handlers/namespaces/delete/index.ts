import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Namespace, NamespacePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const where = await NamespacePermissions.where({ _id: ctx.params.id }, ctx.state.user);
  const record = await Namespace.findOne(where).populate(
    NamespacePermissions.accessControl.options.populate,
  );

  if (!record) {
    throw new RecordNotFoundError('Namespace');
  }

  const result = await NamespacePermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
