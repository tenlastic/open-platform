import { Context } from '@tenlastic/web-server';

import { LogPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await LogPermissions.find(
    ctx.request.query,
    {},
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { records: result };
}
