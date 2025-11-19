import { Next } from 'koa';

import { Context } from '../../types';

export type QueryMiddlewareContext = Context<unknown, JsonQuery, unknown>;

interface JsonQuery {
  [key: string]: unknown;
  json?: string;
}

interface StringQuery {
  [key: string]: string;
}

/**
 * Parses the query string's "query" value into an object from JSON.
 */
export async function queryMiddleware(ctx: QueryMiddlewareContext, next: Next) {
  let query: { [key: string]: unknown };

  if (ctx.request.query.json) {
    try {
      query = JSON.parse(ctx.request.query.json);
      delete ctx.request.query.json;
    } catch {
      throw new Error('Invalid JSON within query string.');
    }
  } else {
    query = Object.entries(ctx.request.query as StringQuery).reduce((previous, [key, value]) => {
      try {
        previous[key] = JSON.parse(value);
      } catch {}

      return previous;
    }, {});
  }

  ctx.request.rawQuery = { ...ctx.request.query } as StringQuery;
  ctx.request.query = { ...ctx.request.query, ...query };

  await next();
}
