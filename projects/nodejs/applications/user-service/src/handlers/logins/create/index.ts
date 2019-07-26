import { Context } from '@tenlastic/api-module';
import * as jwt from 'jsonwebtoken';
import * as uuid from 'uuid/v4';

import { RefreshToken, User, UserPermissions } from '../../../models';

export async function handler(ctx: Context) {
  const { email, password } = ctx.request.body;

  if (!email || !password) {
    throw new Error('Missing required parameters: email and password.');
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !user.activatedAt) {
    throw new Error('Invalid email address or password.');
  }

  const isValidPassword = await user.isValidPassword(password);
  if (!isValidPassword) {
    throw new Error('Invalid email address or password.');
  }

  // Save the RefreshToken for renewal and revocation.
  const jti = uuid();
  const expiresAt = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ expiresAt, jti, userId: user._id });

  // Remove unauthorized fields from the User.
  const userPermissions = new UserPermissions();
  const filteredUser = await userPermissions.read(user, user);

  const accessToken = jwt.sign({ user: filteredUser }, process.env.JWT_SECRET, {
    expiresIn: '15m',
    jwtid: jti,
  });
  const refreshToken = jwt.sign({ user: filteredUser }, process.env.JWT_SECRET, {
    expiresIn: '14d',
    jwtid: jti,
  });

  ctx.response.body = { accessToken, refreshToken };
}
