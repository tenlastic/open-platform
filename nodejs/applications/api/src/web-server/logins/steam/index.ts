import { LoginModel, UserModel } from '@tenlastic/mongoose';
import steam from '@tenlastic/steam';
import { Context, RequiredFieldError, UnauthorizedError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
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

  const isValid = await steam.checkAuthentication({
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
    const { accessToken, refreshToken } = await LoginModel.createAccessAndRefreshTokens(user);
    ctx.response.body = { accessToken, refreshToken };
  } catch (e) {
    throw new UnauthorizedError();
  }
}
