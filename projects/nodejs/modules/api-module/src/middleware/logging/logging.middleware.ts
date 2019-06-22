import { performance } from 'perf_hooks';

import { Context, MiddlewareCallback } from '../..';

/**
 * Logs information about the request and response.
 */
export async function loggingMiddleware(ctx: Context, next: MiddlewareCallback) {
  if (process.env.STAGE === 'test') {
    await next();
    return;
  }

  const start = performance.now();

  await next();

  const duration = Math.round(performance.now() - start);
  const { method, path } = ctx.request;
  const { status } = ctx.response;

  console.log({ duration, method, path, status });
}
