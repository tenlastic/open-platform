import { Context } from '../../context';
import { HttpError } from '../../errors';

/**
 * Authenticates the user's access token.
 */
export async function authenticationMiddleware(ctx: Context, next: () => Promise<void>) {
  if (!ctx.state.apiKey && !ctx.state.user) {
    throw new HttpError(401, 'Invalid access token.');
  }

  await next();
}
