import { LoginDocument, LoginModel, UserModel } from '@tenlastic/mongoose';
import * as steam from '@tenlastic/steam';
import { Context, RequiredFieldError, UnauthorizedError } from '@tenlastic/web-server';

export type CreateLoginWithSteamContext = Context<
  unknown,
  steam.CheckAuthenticationOptions,
  { accessToken?: string; record?: LoginDocument; refreshToken?: string }
>;

export async function handler(ctx: CreateLoginWithSteamContext) {
  const { assocHandle, claimedId, identity, responseNonce, returnTo, sig, signed } =
    ctx.request.body;

  if (!assocHandle || !claimedId || !identity || !responseNonce || !returnTo || !sig || !signed) {
    throw new RequiredFieldError([
      'assocHandle',
      'claimedId',
      'identity',
      'responsedNonce',
      'returnTo',
      'sig',
      'signed',
    ]);
  }

  const isValid = await dependencies.checkAuthentication({
    assocHandle,
    claimedId,
    identity,
    responseNonce,
    returnTo,
    sig,
    signed,
  });
  if (!isValid) {
    throw new UnauthorizedError();
  }

  const steamId = identity.substring(identity.lastIndexOf('/') + 1);
  const user = await UserModel.findOneAndUpdate(
    { steamId },
    { steamId },
    { new: true, upsert: true },
  );

  try {
    const { accessToken, refreshToken, refreshTokenId } =
      await LoginModel.createAccessAndRefreshTokens(user, { provider: 'steam' });
    const record = await LoginModel.create({ refreshTokenId, userId: user._id });

    ctx.response.body = { accessToken, record, refreshToken };
  } catch {
    throw new UnauthorizedError();
  }
}

export const dependencies = { checkAuthentication: steam.checkAuthentication };
