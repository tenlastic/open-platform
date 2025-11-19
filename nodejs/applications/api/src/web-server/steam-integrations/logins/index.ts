import {
  AuthorizationModel,
  LoginDocument,
  LoginModel,
  SteamIntegrationDocument,
  SteamIntegrationModel,
  UserModel,
} from '@tenlastic/mongoose';
import * as steam from '@tenlastic/steam';
import {
  Context,
  RecordNotFoundError,
  RequiredFieldError,
  UnauthorizedError,
} from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

export type CreateLoginWithSteamIntegrationContext = Context<
  mongoose.FilterQuery<SteamIntegrationDocument>,
  { ticket?: string },
  { accessToken?: string; record?: LoginDocument; refreshToken?: string }
>;

export async function handler(ctx: CreateLoginWithSteamIntegrationContext) {
  const { ticket } = ctx.request.body;
  if (!ticket) {
    throw new RequiredFieldError(['ticket']);
  }

  const steamIntegration = await SteamIntegrationModel.findOne(ctx.params);
  if (!steamIntegration) {
    throw new RecordNotFoundError('Record');
  }

  // Authenticate the Session Ticket with Steam.
  const authenticateUserTicketResponse = await dependencies.authenticateUserTicket({
    appId: steamIntegration.applicationId,
    key: steamIntegration.apiKey,
    ticket,
  });
  if (
    !authenticateUserTicketResponse.data?.response?.params ||
    authenticateUserTicketResponse.status !== 200
  ) {
    throw new UnauthorizedError();
  }

  // Make sure the User owns the application.
  const steamId = authenticateUserTicketResponse.data.response.params.steamid;
  const checkAppOwnershipResponse = await dependencies.checkAppOwnership({
    appId: steamIntegration.applicationId,
    key: steamIntegration.apiKey,
    steamId,
  });
  if (
    !checkAppOwnershipResponse.data?.appownership?.ownsapp ||
    checkAppOwnershipResponse.status !== 200
  ) {
    throw new UnauthorizedError();
  }

  let steamPersonaName: string;
  try {
    const response = await dependencies.getPlayerSummaries({
      key: steamIntegration.apiKey,
      steamIds: [steamId],
    });

    if (response.status === 200 && response.data?.response?.players?.length > 0) {
      steamPersonaName = response.data.response.players[0].personaname;
    }
  } catch (e) {
    console.error(e);
  }

  // Upsert the Steam User.
  const update = { steamId, ...(steamPersonaName ? { steamPersonaName } : {}) };
  const user = await UserModel.findOneAndUpdate({ steamId }, update, { new: true, upsert: true });

  // Upsert roles associated with this Steam Integration.
  if (steamIntegration.roles) {
    await AuthorizationModel.findOneAndUpdate(
      { namespaceId: ctx.params.namespaceId, userId: user._id },
      {
        $addToSet: { roles: { $each: steamIntegration.roles } },
        namespaceId: ctx.params.namespaceId,
        userId: user._id,
      },
      { upsert: true },
    );
  }

  try {
    const { accessToken, refreshToken, refreshTokenId } =
      await LoginModel.createAccessAndRefreshTokens(user, { provider: 'steam' });
    const record = await LoginModel.create({ refreshTokenId, userId: user._id });

    ctx.response.body = { accessToken, record, refreshToken };
  } catch {
    throw new UnauthorizedError();
  }
}

export const dependencies = {
  authenticateUserTicket: steam.authenticateUserTicket,
  checkAppOwnership: steam.checkAppOwnership,
  getPlayerSummaries: steam.getPlayerSummaries,
};
