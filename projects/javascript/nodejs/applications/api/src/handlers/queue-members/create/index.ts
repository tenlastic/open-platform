import { Context } from '@tenlastic/web-server';

import { QueueMemberPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { userId: ctx.state.user._id };
  const result = await QueueMemberPermissions.create(ctx.request.body, override, ctx.state.user);

  ctx.response.body = { record: result };
}
