import { Context, StatusCode } from '../definitions';

export async function ping(ctx: Context) {
  ctx.response.status = StatusCode.OK;
}
