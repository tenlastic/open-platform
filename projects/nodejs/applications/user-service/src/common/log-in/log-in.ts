import * as jwt from 'jsonwebtoken';
import * as uuid from 'uuid/v4';

import { RefreshToken, UserDocument, UserPermissions } from '../../models';

export async function logIn(user: UserDocument) {
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

  return { accessToken, refreshToken };
}
