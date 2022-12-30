import { Context } from '@tenlastic/web-socket-server';

export async function handler(ctx: Context) {
  ctx.response.status = 200;
}
