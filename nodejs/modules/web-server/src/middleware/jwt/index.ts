import axios from 'axios';
import * as jsonwebtoken from 'jsonwebtoken';
import { Next } from 'koa';

import { Context } from '../../context';

let jwtPublicKey = process.env.JWT_PUBLIC_KEY;

/**
 * Extracts the user's information from a JWT.
 */
export async function jwtMiddleware(ctx: Context, next: Next) {
  let jwt: any;

  try {
    const authorization = ctx.request.headers.Authorization || ctx.request.headers.authorization;
    const token = authorization.replace('Bearer ', '');

    // If the public key is not specified via environment variables, fetch it from the API.
    if (!jwtPublicKey) {
      const response = await axios({ method: 'get', url: process.env.JWK_URL });
      const x5c = response.data.keys[0].x5c[0];
      jwtPublicKey = `-----BEGIN PUBLIC KEY-----\n${x5c}\n-----END PUBLIC KEY-----`;
    }

    jwt = jsonwebtoken.verify(token, jwtPublicKey.replace(/\\n/g, '\n'), { algorithms: ['RS256'] });
  } catch {
    await next();
    return;
  }

  // Do not accept refresh tokens.
  if (jwt.type !== 'access') {
    await next();
    return;
  }

  ctx.state.authorization = jwt.authorization;
  ctx.state.jwt = jwt;
  ctx.state.user = jwt.user;

  await next();
}
