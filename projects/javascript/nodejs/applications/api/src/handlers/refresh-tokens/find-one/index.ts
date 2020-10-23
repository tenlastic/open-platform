import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { RefreshTokenPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const result = await RefreshTokenPermissions.findOne(
    {},
    override,
    ctx.state.apiKey || ctx.state.user,
  );
  if (!result) {
    throw new RecordNotFoundError('RefreshToken');
  }

  ctx.response.body = { record: result };
}
