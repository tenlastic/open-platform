import { Next } from 'koa';

import { Context } from '../../context';

/**
 * Extracts the user's information from a JWT.
 */
export async function apiKeyMiddleware(ctx: Context, next: Next) {
  ctx.state.apiKey = ctx.request.headers['x-api-key'];

  await next();
}
