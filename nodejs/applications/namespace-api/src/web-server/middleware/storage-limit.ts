import { NamespaceModel } from '@tenlastic/mongoose';
import { Context } from '@tenlastic/web-server';
import { Next } from 'koa';

export async function storageLimitMiddleware(ctx: Context, next: Next) {
  // Allow sidecars to update status even if storage limit is reached.
  if (ctx.request?.body && Object.keys(ctx.request.body).length === 1 && ctx.request.body.status) {
    return next();
  }

  const namespace = await NamespaceModel.findOne({ _id: ctx.params.namespaceId });
  namespace.checkStorageLimit(0);

  return next();
}
