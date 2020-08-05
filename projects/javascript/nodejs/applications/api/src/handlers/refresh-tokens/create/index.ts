import { Context, RecordNotFoundError } from '@tenlastic/web-server';
import * as jwt from 'jsonwebtoken';
import * as uuid from 'uuid/v4';

import { RefreshTokenPermissions, User, UserPermissions } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const user = await User.findOne({ _id: ctx.state.user._id });
  if (!user) {
    throw new RecordNotFoundError('User');
  }

  // Calculate the time difference between the provided expiration and now.
  const expiresIn = ctx.request.body.expiresAt
    ? new Date(ctx.request.body.expiresAt).getTime() - new Date().getTime()
    : null;

  const jti = uuid();
  const filteredUser = await UserPermissions.read(user, user);
  const options: jwt.SignOptions = {
    algorithm: 'RS256',
    jwtid: jti,
    ...(expiresIn && { expiresIn }),
  };
  const refreshToken = jwt.sign(
    { user: filteredUser },
    process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    options,
  );

  const override = { jti, userId: ctx.state.user._id };
  const result = await RefreshTokenPermissions.create(ctx.request.body, override, ctx.state.user);

  ctx.response.body = { record: result, refreshToken };
}
