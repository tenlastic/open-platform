import { Context } from '@tenlastic/web-server';

import { QueueMemberPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { refreshTokenId: ctx.state.jwt.jti };
  const user = ctx.state.apiKey || ctx.state.user;

  const result = await QueueMemberPermissions.create(ctx.request.body, override, user);
  const record = await QueueMemberPermissions.read(result, user);

  ctx.response.body = { record };
}
