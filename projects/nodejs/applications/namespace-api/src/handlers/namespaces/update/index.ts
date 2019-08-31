import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { Namespace, NamespacePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const where = await NamespacePermissions.where({ _id: ctx.params.id }, ctx.state.user);
  const record = await Namespace.findOne(where).populate(NamespacePermissions.populateOptions);

  if (!record) {
    throw new RecordNotFoundError('Namespace');
  }

  const result = await NamespacePermissions.update(record, ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
