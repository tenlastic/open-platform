import { Group, GroupInvitation, GroupPermissions } from '@tenlastic/mongoose';
import { Context, RecordNotFoundError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const group = await Group.findOne({ _id: ctx.params._id });

  if (!group.isOpen) {
    const where = { groupId: ctx.params._id, toUserId: ctx.state.user._id };
    const groupInvitation = await GroupInvitation.findOne(where);
    if (!groupInvitation) {
      throw new RecordNotFoundError();
    }
  }

  const record = await Group.findOneAndUpdate(
    { _id: ctx.params._id },
    { $addToSet: { userIds: ctx.state.user._id } },
    { new: true },
  );

  const credentials = { ...ctx.state };
  const filteredRecord = await GroupPermissions.read(credentials, record);

  const groupInvitations = await GroupInvitation.find({ toUserId: ctx.state.user._id });
  for (const groupInvitation of groupInvitations) {
    await groupInvitation.remove();
  }

  ctx.response.body = { record: filteredRecord };
}
