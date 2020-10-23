import { Context } from '@tenlastic/web-server';

import { GamePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await GamePermissions.create(
    ctx.request.body,
    {},
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { record: result };
}
