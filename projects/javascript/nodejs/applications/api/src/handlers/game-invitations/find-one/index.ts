import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { GameInvitationPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const result = await GameInvitationPermissions.findOne({}, override, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('Game Invitation');
  }

  ctx.response.body = { record: result };
}
