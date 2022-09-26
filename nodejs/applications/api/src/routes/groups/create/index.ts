import { GroupPermissions } from '../../../mongodb';
import { Context } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const override = { ...ctx.params, userIds: [ctx.state.user._id] };

  const result = await GroupPermissions.create(credentials, override, ctx.request.body);
  const record = await GroupPermissions.read(credentials, result);

  ctx.response.body = { record };
}
