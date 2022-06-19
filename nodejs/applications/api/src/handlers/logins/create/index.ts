import { Context, RequiredFieldError } from '@tenlastic/web-server';

import { User } from '@tenlastic/mongoose-models';

export async function handler(ctx: Context) {
  const { password, username } = ctx.request.body;
  if (!password || !username) {
    throw new RequiredFieldError(['password', 'username']);
  }

  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('Invalid username or password.');
  }

  const isValidPassword = await user.isValidPassword(password);
  if (!isValidPassword) {
    throw new Error('Invalid username or password.');
  }

  const { accessToken, refreshToken } = await user.logIn();

  ctx.response.body = { accessToken, refreshToken };
}
