import { Context } from '@tenlastic/web-server';

import { CollectionPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { _id: ctx.params._id };
  const result = await CollectionPermissions.create(
    ctx.request.body,
    override,
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { record: result };
}
