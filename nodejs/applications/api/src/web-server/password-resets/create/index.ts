import { PasswordResetModel, UserModel } from '@tenlastic/mongoose';
import { Context, RequiredFieldError } from '@tenlastic/web-server';
import { Chance } from 'chance';

export type CreatePasswordResetContext = Context<unknown, { email?: string }, void>;

const chance = new Chance();

export async function handler(ctx: CreatePasswordResetContext) {
  const { email } = ctx.request.body;
  if (!email) {
    throw new RequiredFieldError(['email']);
  }

  const user = await UserModel.findOne({ email: email.toLowerCase() });

  if (user) {
    const expiresAt = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
    const hash = chance.hash({ length: 128 });
    await PasswordResetModel.create({ expiresAt, hash, userId: user._id });
  }

  ctx.response.status = 200;
}
