import { Context, RecordNotFoundError } from '@tenlastic/web-server';

import { GroupInvitationPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const override = { where: { _id: ctx.params._id } };
  const result = await GroupInvitationPermissions.findOne({}, override, ctx.state.user);
  if (!result) {
    throw new RecordNotFoundError('Group Invitation');
  }

  ctx.response.body = { record: result };
}
