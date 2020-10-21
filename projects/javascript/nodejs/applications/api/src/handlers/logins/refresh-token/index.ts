import { Context, RequiredFieldError } from '@tenlastic/web-server';
import * as jwt from 'jsonwebtoken';

import { RefreshToken, User } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const { token } = ctx.request.body;
  if (!token) {
    throw new RequiredFieldError(['token']);
  }

  let decodedToken: any;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'), {
      algorithms: ['RS256'],
    });
  } catch (e) {
    throw new Error('Invalid refresh token.');
  }

  if (!decodedToken.jti || !decodedToken.user || !decodedToken.user._id) {
    throw new Error('Invalid refresh token.');
  }

  const refreshTokenDocument = await RefreshToken.findOneAndUpdate(
    {
      _id: decodedToken.jti,
      userId: decodedToken.user._id,
    },
    {
      updatedAt: new Date(),
    },
  );

  if (!refreshTokenDocument) {
    throw new Error('Invalid refresh token.');
  }

  const user = await User.findOne({ _id: refreshTokenDocument.userId });
  if (!user) {
    throw new Error('Invalid refresh token.');
  }

  const { accessToken, refreshToken } = await user.logIn();

  ctx.response.body = { accessToken, refreshToken };
}
