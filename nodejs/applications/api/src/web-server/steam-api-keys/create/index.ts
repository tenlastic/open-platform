import { SteamApiKeyPermissions } from '@tenlastic/mongoose';
import steam from '@tenlastic/steam';
import { Context, HttpError } from '@tenlastic/web-server';

export async function handler(ctx: Context) {
  const { appId, value } = ctx.request.body;

  const response = await steam.getPartnerAppListForWebApiKey({ key: value });
  if (response.status !== 200) {
    throw new HttpError(
      400,
      'Invalid value. Make sure this is a valid Steam Publisher Web API Key.',
    );
  }

  const app = response.data.applist?.apps?.app?.find((a) => a.appid === appId);
  if (!app) {
    throw new HttpError(
      400,
      'Invalid appId. Make sure the Steam Publisher Web API Key has ownership of this App ID.',
    );
  }

  const credentials = { ...ctx.state };
  const result = await SteamApiKeyPermissions.create(credentials, ctx.params, ctx.request.body);
  const record = await SteamApiKeyPermissions.read(credentials, result);

  ctx.response.body = { record };
}
