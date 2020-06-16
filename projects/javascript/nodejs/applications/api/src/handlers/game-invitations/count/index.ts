import { Context } from '@tenlastic/web-server';

import { GameInvitationPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const result = await GameInvitationPermissions.count(ctx.request.query.where, {}, ctx.state.user);

  ctx.response.body = { count: result };
}
