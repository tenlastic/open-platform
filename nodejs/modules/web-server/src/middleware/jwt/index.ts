import { Authorization, User } from '@tenlastic/mongoose-models';
import * as jsonwebtoken from 'jsonwebtoken';
import * as requestPromiseNative from 'request-promise-native';

import { Context } from '../../context';

let jwtPublicKey = process.env.JWT_PUBLIC_KEY;

/**
 * Extracts the user's information from a JWT.
 */
export async function jwtMiddleware(ctx: Context, next: () => Promise<void>) {
  let jwt: any;

  try {
    const authorization = ctx.request.headers.Authorization || ctx.request.headers.authorization;
    const token = authorization.replace('Bearer ', '');

    // If the public key is not specified via environment variables, fetch it from the API.
    if (!jwtPublicKey) {
      const response = await requestPromiseNative.get({ json: true, url: process.env.JWK_URL });
      const x5c = response.keys[0].x5c[0];
      jwtPublicKey = `-----BEGIN PUBLIC KEY-----\n${x5c}\n-----END PUBLIC KEY-----`;
    }

    jwt = jsonwebtoken.verify(token, jwtPublicKey.replace(/\\n/g, '\n'), {
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

  if (jwt.authorization && jwt.user) {
    ctx.state.authorization = Authorization.hydrate(jwt.authorization);
    ctx.state.user = User.hydrate(jwt.user);
  } else if (jwt.user) {
    ctx.state.authorization = await Authorization.findOne({
      namespaceId: { $exists: false },
      userId: jwt.user._id,
    });
    ctx.state.user = User.hydrate(jwt.user);
  }

  await next();
}
