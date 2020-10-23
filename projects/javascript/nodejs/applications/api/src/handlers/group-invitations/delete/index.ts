import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { GroupInvitation, GroupInvitationPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const where = await GroupInvitationPermissions.where(
    { _id: ctx.params._id },
    ctx.state.apiKey || ctx.state.user,
  );
  const record = await GroupInvitation.findOne(where).populate(
    GroupInvitationPermissions.accessControl.options.populate,
  );
  if (!record) {
    throw new RecordNotFoundError('Group Invitation');
  }

  const result = await GroupInvitationPermissions.delete(
    record,
    ctx.state.apiKey || ctx.state.user,
  );

  ctx.response.body = { record: result };
}
