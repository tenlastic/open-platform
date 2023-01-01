import { NamespaceModel } from '@tenlastic/mongoose';
import { Context } from '@tenlastic/web-socket-server';
import { Next } from 'koa';

export async function storageLimitMiddleware(ctx: Context, next: Next) {
  const namespace = await NamespaceModel.findOne({ _id: ctx.params.namespaceId });
  namespace.checkStorageLimit(0);

  return next();
}
