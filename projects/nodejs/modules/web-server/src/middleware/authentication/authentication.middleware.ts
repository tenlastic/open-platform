import { Context, HttpError, MiddlewareCallback } from '../../';

/**
 * Authenticates the user's access token.
 */
export async function authenticationMiddleware(ctx: Context, next: MiddlewareCallback) {
  if (!ctx.state.user) {
    throw new HttpError(401, 'Invalid access token.');
  }

  await next();
}
