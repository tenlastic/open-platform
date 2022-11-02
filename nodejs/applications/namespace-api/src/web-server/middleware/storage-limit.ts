import { Context, Next } from 'koa';

import { Namespace } from '../../mongodb';

export async function storageLimitMiddleware(ctx: Context, next: Next) {
  // Allow sidecars to update status even if storage limit is reached.
  if (ctx.request?.body && Object.keys(ctx.request.body).length === 1 && ctx.request.body.status) {
    await next();
    return;
  }

  const namespace = await Namespace.findOne({ _id: ctx.params.namespaceId });
  namespace.checkStorageLimit(0);

  await next();
}