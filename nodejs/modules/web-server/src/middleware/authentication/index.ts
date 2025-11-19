import { Next } from 'koa';

import { UnauthorizedError } from '../../errors';
import { Context } from '../../types';

/**
 * Authenticates the user's access token.
 */
export async function authenticationMiddleware(ctx: Context, next: Next) {
  if (!ctx.state?.apiKey && !ctx.state?.user) {
    throw new UnauthorizedError('Invalid access token.');
  }

  await next();
}
