import { GroupDocument, GroupModel, GroupPermissionOptions } from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { Context, RecordNotFoundError, RecordResponse } from '@tenlastic/web-server';

export type LeaveGroupContext = Context<
  { _id?: string; groupId?: string; namespaceId?: string },
  void,
  RecordResponse<GroupDocument>
>;

export async function handler(ctx: LeaveGroupContext) {
  const { _id, groupId, namespaceId } = ctx.params;
  const context = {
    credentials: { ...ctx.state },
    Model: GroupModel,
    options: GroupPermissionOptions,
  };

  const group = await permissions.findOne(context, {}, { where: { _id: groupId, namespaceId } });
  if (!group) {
    throw new RecordNotFoundError();
  }

  // If the User is not the leader and is not removing themselves throw an error.
  const isLeader = group.userId.equals(ctx.state.user._id);
  const isMember = group.userIds.some((ui) => ui.equals(ctx.state.user._id));
  if (!isLeader && (!isMember || _id !== ctx.state.user._id)) {
    throw new permissions.PermissionError();
  }

  const userIds = group.userIds.filter((ui) => !ui.equals(_id));
  const userId = group.userId.equals(_id) ? userIds[0] || null : group.userId;

  const result = await GroupModel.findOneAndUpdate(
    { _id: groupId, namespaceId },
    { userId, userIds },
    { new: true },
  );
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
