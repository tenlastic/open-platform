import { Context } from '@tenlastic/web-server';

import { CollectionPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { databaseId: ctx.params.databaseId };

  const result = await CollectionPermissions.create(ctx.request.body, override, ctx.state.user);

  ctx.response.body = { record: result };
}
