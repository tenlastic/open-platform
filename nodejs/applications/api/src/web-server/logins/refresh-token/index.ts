import { LoginModel, UserModel } from '@tenlastic/mongoose';
import { Context, Jwt, RequiredFieldError } from '@tenlastic/web-server';
import * as jsonwebtoken from 'jsonwebtoken';

export class RefreshTokenError extends Error {
  public name: string;
  public status = 401;

  constructor() {
    super('Invalid refresh token.');
    this.name = 'RefreshTokenError';
  }
}

export type CreateLoginWithRefreshTokenContext = Context<
  unknown,
  { token?: string },
  { accessToken?: string; refreshToken?: string }
>;

export async function handler(ctx: CreateLoginWithRefreshTokenContext) {
  const { token } = ctx.request.body;
  if (!token) {
    throw new RequiredFieldError(['token']);
  }

  let jwt: Jwt;
  try {
    jwt = jsonwebtoken.verify(token, process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'), {
      algorithms: ['RS256'],
    }) as Jwt;
  } catch {
    throw new RefreshTokenError();
  }

  if (!jwt.jti || jwt.type !== 'refresh' || !jwt.user || !jwt.user._id) {
    throw new RefreshTokenError();
  }

  const user = await UserModel.findOne({ _id: jwt.user._id });
  if (!user) {
    throw new RefreshTokenError();
  }

  try {
    const { accessToken, refreshToken } = await LoginModel.createAccessAndRefreshTokens(user, {
      refreshTokenId: jwt.jti,
    });
    ctx.response.body = { accessToken, refreshToken };
  } catch {
    throw new RefreshTokenError();
  }
}
