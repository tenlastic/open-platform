import { Context } from '../../context';

/**
 * Logs information about the request and response.
 */
export async function loggingMiddleware(ctx: Context, next: () => Promise<void>) {
  if (process.env.NODE_ENV === 'test') {
    await next();
    return;
  }

  const start = Date.now();

  try {
    await next();
  } catch {}

  const duration = Date.now() - start;
  const { method, path } = ctx.request;
  const { status } = ctx.response;

  console.log({ duration, method, path, status });
}
