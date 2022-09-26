import { Context } from '../../context';

/**
 * Parses the query string's "query" value into an object from JSON.
 */
export async function queryMiddleware(ctx: Context, next: () => Promise<void>) {
  let query: { [key: string]: any };

  if (ctx.request.query.json) {
    try {
      query = JSON.parse(ctx.request.query.json);
      delete ctx.request.query.json;
    } catch {
      throw new Error('Invalid JSON within query string.');
    }
  } else {
    query = Object.entries<string>(ctx.request.query).reduce((previous, [key, value]) => {
      try {
        previous[key] = JSON.parse(value);
      } catch {}

      return previous;
    }, {});
  }

  Object.assign(ctx.request.query, query);

  await next();
}
