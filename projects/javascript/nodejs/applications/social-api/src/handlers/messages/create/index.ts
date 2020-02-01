import { Context } from '@tenlastic/web-server';

import { MessagePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await MessagePermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
