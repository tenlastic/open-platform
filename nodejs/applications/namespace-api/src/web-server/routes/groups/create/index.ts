import { GroupPermissions } from '@tenlastic/mongoose';
import { Context } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const override = { ...ctx.params, userId: ctx.state.user._id, userIds: [ctx.state.user._id] };

  const result = await GroupPermissions.create(credentials, override, {});
  const record = await GroupPermissions.read(credentials, result);

  ctx.response.body = { record };
}
