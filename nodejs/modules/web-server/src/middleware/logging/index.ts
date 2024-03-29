import { Next } from 'koa';

import { Context } from '../../context';

/**
 * Logs information about the request and response.
 */
export async function loggingMiddleware(ctx: Context, next: Next) {
  if (process.env.NODE_ENV === 'test') {
    await next();
    return;
  }

  const start = Date.now();

  await next();

  const duration = Date.now() - start;
  const { method, path } = ctx.request;
  const { status } = ctx.response;

  // Do not log liveness and readiness probes.
  if (path.startsWith('/probes')) {
    return;
  }

  console.log({ duration, method, path, status });
}
