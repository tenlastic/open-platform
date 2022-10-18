import { Login, User } from '../../../mongodb';
import { Context, RequiredFieldError } from '@tenlastic/web-server';
import * as jsonwebtoken from 'jsonwebtoken';

export class RefreshTokenError extends Error {
  public name: string;
  public status = 401;

  constructor() {
    super('Invalid refresh token.');
    this.name = 'RefreshTokenError';
  }
}

export async function handler(ctx: Context) {
  const { token } = ctx.request.body;
  if (!token) {
    throw new RequiredFieldError(['token']);
  }

  let jwt: any;
  try {
    jwt = jsonwebtoken.verify(token, process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'), {
      algorithms: ['RS256'],
    });
  } catch (e) {
    throw new RefreshTokenError();
  }

  if (!jwt.jti || jwt.type !== 'refresh' || !jwt.user || !jwt.user._id) {
    throw new RefreshTokenError();
  }

  const user = await User.findOne({ _id: jwt.user._id });
  if (!user) {
    throw new RefreshTokenError();
  }

  try {
    const { accessToken, refreshToken } = await Login.createAccessAndRefreshTokens(user, jwt.jti);
    ctx.response.body = { accessToken, refreshToken };
  } catch (e) {
    throw new RefreshTokenError();
  }
}
