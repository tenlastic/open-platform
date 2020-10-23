import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { GameInvitation, GameInvitationPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const where = await GameInvitationPermissions.where(
    { _id: ctx.params._id },
    ctx.state.apiKey || ctx.state.user,
  );
  const record = await GameInvitation.findOne(where).populate(
    GameInvitationPermissions.accessControl.options.populate,
  );
  if (!record) {
    throw new RecordNotFoundError('Game Invitation');
  }

  const result = await GameInvitationPermissions.delete(record, ctx.state.apiKey || ctx.state.user);

  ctx.response.body = { record: result };
}
