import { Context } from '@tenlastic/web-server';

import { LogPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await LogPermissions.create(
    ctx.request.body,
    {},
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { record: result };
}
