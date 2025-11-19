import {
  QueueMemberDocument,
  QueueMemberModel,
  QueueMemberPermissionOptions,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import { Context } from '@tenlastic/web-socket-server';
import * as mongoose from 'mongoose';

export type CreateQueueMemberContext = Context<
  Partial<QueueMemberDocument>,
  { record: Partial<QueueMemberDocument> }
>;

export async function handler(ctx: CreateQueueMemberContext) {
  if (!ctx.state.user || !ctx.state.webSocket) {
    throw new Error('Cannot create Queue Member using an API Key.');
  }

  const namespaceId = new mongoose.Types.ObjectId(ctx.state.webSocket.namespaceId);
  const userId = new mongoose.Types.ObjectId(ctx.state.user._id);
  const webSocketId = new mongoose.Types.ObjectId(ctx.state.webSocket._id);

  const context = {
    credentials: { ...ctx.state },
    Model: QueueMemberModel,
    options: QueueMemberPermissionOptions,
  };
  const overlayParameters = { namespaceId, userId, webSocketId };
  const result = await permissions.create(context, ctx.request.body, overlayParameters);
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}
