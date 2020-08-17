import { Context } from '@tenlastic/web-server';

import { QueueMemberPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await QueueMemberPermissions.create(ctx.request.body, {}, ctx.state.user);

  ctx.response.body = { record: result };
}
