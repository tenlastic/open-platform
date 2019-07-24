import { Context } from '@tenlastic/api-module';

import { RefreshToken } from '../../../models';

export async function handler(ctx: Context) {
  const { jti } = ctx.state.jwt;
  await RefreshToken.findOneAndDelete({ jti });

  ctx.response.status = 200;
}
