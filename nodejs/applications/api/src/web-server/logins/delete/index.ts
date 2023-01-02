import { RefreshTokenModel } from '@tenlastic/mongoose';
import { Context } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  if (ctx.state.jwt) {
    await RefreshTokenModel.findOneAndDelete({ _id: ctx.state.jwt.jti });
  }

  ctx.response.status = 200;
  ctx.response.body = {};
}
