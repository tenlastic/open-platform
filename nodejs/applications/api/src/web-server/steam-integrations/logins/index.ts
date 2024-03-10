import { LoginModel, SteamIntegrationModel, UserModel } from '@tenlastic/mongoose';
import steam from '@tenlastic/steam';
import {
  Context,
  RecordNotFoundError,
  RequiredFieldError,
  UnauthorizedError,
} from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { ticket } = ctx.request.body;
  if (!ticket) {
    throw new RequiredFieldError(['ticket']);
  }

  const steamIntegration = await SteamIntegrationModel.findOne(ctx.params);
  if (!steamIntegration) {
    throw new RecordNotFoundError('Record');
  }

  const response = await steam.authenticateUserTicket({
    appid: steamIntegration.applicationId,
    key: steamIntegration.apiKey,
    ticket,
  });
  if (!response.data.response.params || response.status !== 200) {
    throw new UnauthorizedError();
  }

  const steamId = response.data.response.params.steamid;
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
