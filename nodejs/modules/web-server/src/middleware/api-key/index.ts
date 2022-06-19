import { Context } from '../../context';

/**
 * Extracts the user's information from a JWT.
 */
export async function apiKeyMiddleware(ctx: Context, next: () => Promise<void>) {
  ctx.state.apiKey = ctx.request.headers['x-api-key'];

  await next();
}
