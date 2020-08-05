import { Context } from '@tenlastic/web-server';

import { GroupPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { userIds: [ctx.state.user._id] };
  const result = await GroupPermissions.create(ctx.request.body, override, ctx.state.user);

  ctx.response.body = { record: result };
}
