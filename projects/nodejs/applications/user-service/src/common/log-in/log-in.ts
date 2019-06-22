import * as jwt from 'jsonwebtoken';

import { UserDocument, UserPermissions } from '../../models';

const JWT_EXPIRES_IN = '15m';
const JWT_REFRESH_EXPIRES_IN = '14d';

export async function logIn(user: UserDocument) {
  if (!user.isActive) {
    throw new Error('Account is not activated.');
  }

  user.lastLoginAt = new Date();
  user = await user.save();

  const userPermissions = new UserPermissions();
  user = await userPermissions.read(user, user);

  const accessToken = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

  return { accessToken, refreshToken, user };
}
