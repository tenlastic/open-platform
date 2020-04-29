import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { NamespacePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const query = { where: { _id: ctx.params.id } };
  const result = await NamespacePermissions.findOne(query, {}, ctx.state.user);

  if (!result) {
    throw new RecordNotFoundError('Namespace');
  }

  ctx.response.body = { record: result };
}
