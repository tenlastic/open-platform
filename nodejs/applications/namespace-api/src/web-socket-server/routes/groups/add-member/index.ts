import {
  GroupInvitationModel,
  GroupMemberModel,
  GroupModel,
  GroupPermissions,
} from '@tenlastic/mongoose';
import { RecordNotFoundError } from '@tenlastic/web-server';
import { Context } from '@tenlastic/web-socket-server';
import * as mongoose from 'mongoose';

export async function handler(ctx: Context) {
  if (!ctx.state.user || !ctx.state.webSocket) {
    throw new Error('Cannot add Group Member using an API Key.');
  }

  const namespaceId = new mongoose.Types.ObjectId(ctx.state.webSocket.get('namespaceId'));
  const userId = new mongoose.Types.ObjectId(ctx.state.user._id);

  const where = { groupId: ctx.params._id, namespaceId, toUserId: userId };
  const groupInvitation = await GroupInvitationModel.findOne(where);

  if (!groupInvitation) {
    throw new RecordNotFoundError();
  }

  const member = new GroupMemberModel({ userId, webSocketId: ctx.state.webSocket._id });
  const record = await GroupModel.findOneAndUpdate(
    { _id: ctx.params._id },
    { $addToSet: { members: member } },
    { new: true },
  );

  const credentials = { ...ctx.state };
  const filteredRecord = await GroupPermissions.read(credentials, record);

  ctx.response.body = { record: filteredRecord };
}
