import { Context, MiddlewareCallback } from '../..';

/**
 * Parses the query string's "query" value into an object from JSON.
 */
export async function queryMiddleware(ctx: Context, next: MiddlewareCallback) {
  if (!ctx.request.query || !ctx.request.query.query) {
    ctx.request.query = {};
    return await next();
  }

  try {
    const json = JSON.parse(ctx.request.query.query);
    Object.assign(ctx.request.query, json);
    delete ctx.request.query.query;
  } catch {
    throw new Error('Query parameters must be valid JSON.');
  }

  await next();
}
