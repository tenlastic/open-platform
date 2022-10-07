import { Context } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  ctx.response.status = 200;
}
