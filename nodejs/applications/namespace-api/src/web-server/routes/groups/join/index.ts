import {
  GroupDocument,
  GroupInvitationModel,
  GroupInvitationPermissionOptions,
  GroupModel,
  GroupPermissionOptions,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { RecordNotFoundError } from '@tenlastic/web-server';
import { UpdateOneContext } from 'modules/web-server/dist';
import * as mongoose from 'mongoose';

export async function handler(ctx: UpdateOneContext<GroupDocument>) {
  const { _id, namespaceId } = ctx.params;

  const groupInvitationContext = {
    credentials: { ...ctx.state },
    Model: GroupInvitationModel,
    options: GroupInvitationPermissionOptions,
  };
  const groupInvitation = await permissions.findOne(
    groupInvitationContext,
    {},
    { where: { groupId: _id, namespaceId, toUserId: ctx.state.user._id } },
  );
  if (!groupInvitation) {
    throw new RecordNotFoundError();
  }

  const groupContext = {
    credentials: { ...ctx.state },
    Model: GroupModel,
    options: GroupPermissionOptions,
  };
  const group = await permissions.findOne(groupContext, {}, { where: ctx.params });
  if (!group) {
    throw new RecordNotFoundError();
  }

  const userId = new mongoose.Types.ObjectId(ctx.state.user._id);
  const userIds = group.userIds.some((ui) => ui.equals(userId))
    ? group.userIds
    : [...group.userIds, userId];

  const result = await GroupModel.findOneAndUpdate(ctx.params, { userIds }, { new: true });
  const record = await permissions.read(groupContext, result);

  ctx.response.body = { record };
}
