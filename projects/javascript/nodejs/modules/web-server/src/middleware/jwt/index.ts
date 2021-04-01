import * as jsonwebtoken from 'jsonwebtoken';

import { Context } from '../../context';

/**
 * Extracts the user's information from a JWT.
 */
export async function jwtMiddleware(ctx: Context, next: () => Promise<void>) {
  let jwt: any;

  try {
    const authorization = ctx.request.headers.Authorization || ctx.request.headers.authorization;
    const token = authorization.replace('Bearer ', '');
    jwt = jsonwebtoken.verify(token, process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'), {
      algorithms: ['RS256'],
    });
  } catch {
    await next();
    return;
  }

  // Do not accept refresh tokens.
  if (jwt.type !== 'access') {
    await next();
    return;
  }

  ctx.state.jwt = jwt;
  ctx.state.user = jwt.user;

  await next();
}
