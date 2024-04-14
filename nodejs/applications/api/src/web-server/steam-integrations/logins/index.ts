import {
  AuthorizationModel,
  LoginModel,
  SteamIntegrationModel,
  UserModel,
} from '@tenlastic/mongoose';
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

  // Authenticate the Session Ticket with Steam.
  const authenticateUserTicketResponse = await steam.authenticateUserTicket({
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
  const checkAppOwnershipResponse = await steam.checkAppOwnership({
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

  let personaName: string;
  try {
    const response = await steam.getPlayerSummaries({
      key: steamIntegration.apiKey,
      steamIds: [steamId],
    });
    personaName = response.data.response.players[0]?.personaname;
  } catch (e) {
    console.error(e);
  }

  // Upsert the Steam User.
  const update = { ...(personaName ? { personaName } : {}), steamId };
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
  } catch (e) {
    throw new UnauthorizedError();
  }
}
