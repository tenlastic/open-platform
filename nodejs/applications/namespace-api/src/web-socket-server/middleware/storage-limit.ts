import { NamespaceModel, WebSocketDocument } from '@tenlastic/mongoose';
import { Context } from '@tenlastic/web-socket-server';
import { Next } from 'koa';

export async function storageLimitMiddleware(ctx: Context, next: Next) {
  const webSocket = ctx.state.webSocket as WebSocketDocument;

  const namespace = await NamespaceModel.findOne({ _id: webSocket.namespaceId });
  namespace.checkStorageLimit(0);

  return next();
}
