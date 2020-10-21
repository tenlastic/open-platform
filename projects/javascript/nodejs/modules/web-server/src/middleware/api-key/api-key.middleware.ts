import { Context, MiddlewareCallback } from '../..';

/**
 * Extracts the user's information from a JWT.
 */
export async function apiKeyMiddleware(ctx: Context, next: MiddlewareCallback) {
  ctx.state.apiKey = ctx.request.headers['x-api-key'];

  await next();
}
