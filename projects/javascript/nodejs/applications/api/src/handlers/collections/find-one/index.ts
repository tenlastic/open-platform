import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { CollectionPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const result = await CollectionPermissions.findOne(
    {},
    override,
    ctx.state.apiKey || ctx.state.user,
  );
  if (!result) {
    throw new RecordNotFoundError('Collection');
  }

  ctx.response.body = { record: result };
}
