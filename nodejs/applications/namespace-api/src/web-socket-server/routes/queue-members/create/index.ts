import { QueueMemberPermissions } from '@tenlastic/mongoose';
import { Context } from '@tenlastic/web-socket-server';
import * as mongoose from 'mongoose';

export async function handler(ctx: Context) {
  if (!ctx.state.user || !ctx.state.webSocket) {
    throw new Error('Cannot create Queue Member using an API Key.');
  }

  const namespaceId = new mongoose.Types.ObjectId(ctx.state.webSocket.get('namespaceId'));
  const userId = new mongoose.Types.ObjectId(ctx.state.user._id);

  const credentials = { ...ctx.state };
  const override = { namespaceId, userId, webSocketId: ctx.state.webSocket._id };
  const result = await QueueMemberPermissions.create(credentials, override, ctx.request.body);
  const record = await QueueMemberPermissions.read(credentials, result);

  ctx.response.body = { record };
}
