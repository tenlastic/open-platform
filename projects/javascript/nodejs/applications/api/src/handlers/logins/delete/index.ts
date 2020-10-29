import { Context } from '@tenlastic/web-server';

import { RefreshToken } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  if (ctx.state.jwt) {
    await RefreshToken.findOneAndDelete({ _id: ctx.state.jwt.jti });
  }

  ctx.response.status = 200;
}
