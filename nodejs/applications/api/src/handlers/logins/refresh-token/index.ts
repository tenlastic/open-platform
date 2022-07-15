import { Login, User } from '@tenlastic/mongoose-models';
import { Context, RequiredFieldError } from '@tenlastic/web-server';
import * as jsonwebtoken from 'jsonwebtoken';

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
    throw new Error('Invalid refresh token.');
  }

  if (!jwt.jti || jwt.type !== 'refresh' || !jwt.user || !jwt.user._id) {
    throw new Error('Invalid refresh token.');
  }

  const user = await User.findOne({ _id: jwt.user._id });
  if (!user) {
    throw new Error('Invalid refresh token.');
  }

  try {
    const { accessToken, refreshToken } = await Login.createAccessAndRefreshTokens(user, jwt.jti);
    ctx.response.body = { accessToken, refreshToken };
  } catch (e) {
    throw e;
    throw new Error('Invalid refresh token.');
  }
}
