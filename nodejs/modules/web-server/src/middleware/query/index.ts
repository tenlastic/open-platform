import { Context } from '../../context';

/**
 * Parses the query string's "query" value into an object from JSON.
 */
export async function queryMiddleware(ctx: Context, next: () => Promise<void>) {
  if (!ctx.request.querystring || !ctx.request.querystring.length) {
    return next();
  }

  try {
    let query: { [key: string]: any };

    if (ctx.request.querystring.includes('=')) {
      query = Object.entries<string>(ctx.request.query).reduce((previous, [key, value]) => {
        previous[key] = JSON.parse(value);
        return previous;
      }, {});
    } else {
      const querystring = decodeURIComponent(ctx.request.querystring);
      query = JSON.parse(querystring);
    }

    Object.assign(ctx.request.query, query);
  } catch {
    throw new Error('Query parameters must be valid JSON.');
  }

  await next();
}
