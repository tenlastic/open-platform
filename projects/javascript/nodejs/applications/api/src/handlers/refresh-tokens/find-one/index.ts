import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { RefreshTokenPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { where: { jti: ctx.params.jti } };
  const result = await RefreshTokenPermissions.findOne({}, override, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('RefreshToken');
  }

  ctx.response.body = { record: result };
}
