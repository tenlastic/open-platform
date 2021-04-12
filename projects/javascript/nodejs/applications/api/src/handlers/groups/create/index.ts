import { GroupPermissions } from '@tenlastic/mongoose-models';
import { Context } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const override = { ...ctx.params, userIds: [ctx.state.user._id] };
  const user = ctx.state.apiKey || ctx.state.user;

  const result = await GroupPermissions.create(ctx.request.body, override, user);
  const record = await GroupPermissions.read(result, user);

  ctx.response.body = { record };
}
