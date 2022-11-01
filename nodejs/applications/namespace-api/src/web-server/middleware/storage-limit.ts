import { Context, Next } from 'koa';

import { Namespace } from '../../mongodb';

export async function storageLimitMiddleware(ctx: Context, next: Next) {
  const namespace = await Namespace.findOne({ _id: ctx.params.namespaceId });
  namespace.checkStorageLimit(0);

  await next();
}
