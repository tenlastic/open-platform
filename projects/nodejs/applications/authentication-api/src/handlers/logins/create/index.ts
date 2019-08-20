import { Context, RequiredFieldError } from '@tenlastic/web-server';

import { User } from '../../../models';

export async function handler(ctx: Context) {
  const { email, password } = ctx.request.body;

  if (!email || !password) {
    throw new RequiredFieldError(['email', 'password']);
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !user.activatedAt) {
    throw new Error('Invalid email address or password.');
  }

  const isValidPassword = await user.isValidPassword(password);
  if (!isValidPassword) {
    throw new Error('Invalid email address or password.');
  }

  const { accessToken, refreshToken } = await user.logIn();

  ctx.response.body = { accessToken, refreshToken };
}
