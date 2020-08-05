import { Context } from '@tenlastic/web-server';

import { ReleasePermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await ReleasePermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
