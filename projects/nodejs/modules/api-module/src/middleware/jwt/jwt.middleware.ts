import * as jwt from 'jsonwebtoken';

import { Context, MiddlewareCallback } from '../..';

/**
 * Extracts the user's information from a JWT.
 */
export async function jwtMiddleware(ctx: Context, next: MiddlewareCallback) {
  try {
    const authorization = ctx.request.headers.Authorization || ctx.request.headers.authorization;
    const token = authorization.replace('Bearer ', '');
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET);

    ctx.state.user = decoded.user;
  } catch {}

  await next();
}
