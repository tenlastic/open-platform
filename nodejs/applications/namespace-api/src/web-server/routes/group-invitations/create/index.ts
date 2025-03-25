import { GroupInvitationPermissions } from '@tenlastic/mongoose';
import { Context } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const credentials = { ...ctx.state };
  const override = { ...ctx.params, fromUserId: ctx.state.user._id };
  const result = await GroupInvitationPermissions.create(credentials, override, ctx.request.body);
  const record = await GroupInvitationPermissions.read(credentials, result);

  ctx.response.body = { record };
}
