import { Context } from '@tenlastic/web-server';

import { CollectionPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { databaseId: ctx.params.databaseId } };
  const result = await CollectionPermissions.find(ctx.request.query, override, ctx.state.user);

  ctx.response.body = { records: result };
}
