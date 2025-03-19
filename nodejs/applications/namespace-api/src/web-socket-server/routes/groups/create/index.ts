import { GroupMemberModel, GroupPermissions } from '@tenlastic/mongoose';
import { Context } from '@tenlastic/web-socket-server';
import * as mongoose from 'mongoose';

export async function handler(ctx: Context) {
  if (!ctx.state.user || !ctx.state.webSocket) {
    throw new Error('Cannot create Group using an API Key.');
  }

  const namespaceId = new mongoose.Types.ObjectId(ctx.state.webSocket.get('namespaceId'));
  const userId = new mongoose.Types.ObjectId(ctx.state.user._id);
  const member = new GroupMemberModel({ userId, webSocketId: ctx.state.webSocket._id });

  const credentials = { ...ctx.state };
  const override = { namespaceId, members: [member] };
  const result = await GroupPermissions.create(credentials, override, {});
  const record = await GroupPermissions.read(credentials, result);

  ctx.response.body = { record };
}
