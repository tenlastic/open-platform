import { Context } from '@tenlastic/web-server';

import { GameInvitationPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const result = await GameInvitationPermissions.find(ctx.request.query, {}, ctx.state.user);

  ctx.response.body = { records: result };
}
