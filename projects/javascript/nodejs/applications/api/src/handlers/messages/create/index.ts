import { Context } from '@tenlastic/web-server';

import { MessagePermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { readByUserIds: [ctx.state.user._id] };
  const result = await MessagePermissions.create(ctx.request.body, override, ctx.state.user);

  ctx.response.body = { record: result };
}
