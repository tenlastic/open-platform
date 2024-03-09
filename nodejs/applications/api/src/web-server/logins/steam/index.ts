import { LoginModel, SteamApiKeyModel, UserModel } from '@tenlastic/mongoose';
import { Context, HttpError, RequiredFieldError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { appId, ticket } = ctx.request.body;
  if (!appId || !ticket) {
    throw new RequiredFieldError(['appId', 'ticket']);
  }

  const steamApiKeys = await SteamApiKeyModel.find({ appId });
  if (!steamApiKeys.length) {
    throw new HttpError(401, 'Invalid App ID.');
  }

  const user = await UserModel.findOne({ _id: jwt.user._id });
  if (!user) {
    throw new RefreshTokenError();
  }

  try {
    const { accessToken, refreshToken } = await LoginModel.createAccessAndRefreshTokens(
      user,
      jwt.jti,
    );
    ctx.response.body = { accessToken, refreshToken };
  } catch (e) {
    throw new RefreshTokenError();
  }
}
