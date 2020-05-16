import { Context } from '@tenlastic/web-server';

import { GroupInvitationPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const override = { fromUserId: ctx.state.user._id };
  const result = await GroupInvitationPermissions.create(
    ctx.request.body,
    override,
    ctx.state.user,
  );

  ctx.response.body = { record: result };
}
