import { Context } from '@tenlastic/web-server';

import { GroupInvitationPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await GroupInvitationPermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
