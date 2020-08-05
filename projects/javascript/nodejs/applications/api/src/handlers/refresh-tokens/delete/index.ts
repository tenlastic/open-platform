import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { RefreshToken, RefreshTokenPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const where = await RefreshTokenPermissions.where({ jti: ctx.params.jti }, ctx.state.user);
  const record = await RefreshToken.findOne(where).populate(
    RefreshTokenPermissions.accessControl.options.populate,
  );
  if (!record) {
    throw new RecordNotFoundError('RefreshToken');
  }

  const result = await RefreshTokenPermissions.delete(record, ctx.state.user);

  ctx.response.body = { record: result };
}
