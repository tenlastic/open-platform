import { Context } from '@tenlastic/web-server';

import { RefreshToken } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  if (ctx.state.jwt) {
    const { jti } = ctx.state.jwt;
    await RefreshToken.findOneAndDelete({ jti });
  }

  ctx.response.status = 200;
  ctx.response.body = {};
}
