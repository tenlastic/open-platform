import { performance } from 'perf_hooks';

import { Context, MiddlewareCallback } from '../..';

/**
 * Logs information about the request and response.
 */
export async function loggingMiddleware(ctx: Context, next: MiddlewareCallback) {
  if (process.env.NODE_ENV === 'test') {
    await next();
    return;
  }

  const start = Date.now();

  await next();

  const duration = Date.now() - start;
  const { method, path } = ctx.request;
  const { status } = ctx.response;

  console.log({ duration, method, path, status });
}
