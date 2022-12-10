import { GroupModel, GroupInvitationModel, GroupPermissions } from '@tenlastic/mongoose';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const group = await GroupModel.findOne({ _id: ctx.params._id });

  if (!group.open) {
    const where = { groupId: ctx.params._id, toUserId: ctx.state.user._id };
    const groupInvitation = await GroupInvitationModel.findOne(where);
    if (!groupInvitation) {
      throw new RecordNotFoundError();
    }
  }

  const record = await GroupModel.findOneAndUpdate(
    { _id: ctx.params._id },
    { $addToSet: { userIds: ctx.state.user._id } },
    { new: true },
  );

  const credentials = { ...ctx.state };
  const filteredRecord = await GroupPermissions.read(credentials, record);

  ctx.response.body = { record: filteredRecord };
}
