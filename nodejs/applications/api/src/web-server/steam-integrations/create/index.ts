import {
  SteamIntegrationDocument,
  SteamIntegrationModel,
  SteamIntegrationPermissionOptions,
} from '@tenlastic/mongoose';
import * as permissions from '@tenlastic/mongoose-permissions';
import * as steam from '@tenlastic/steam';
import { Context, HttpError, RecordRequest, RecordResponse } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

export type CreateSteamIntegrationContext = Context<
  mongoose.FilterQuery<SteamIntegrationDocument>,
  RecordRequest<SteamIntegrationDocument>,
  RecordResponse<SteamIntegrationDocument>
>;

export async function handler(ctx: CreateSteamIntegrationContext) {
  const { apiKey, applicationId } = ctx.request.body;

  const response = await dependencies.getPartnerAppListForWebApiKey({ key: apiKey });
  if (response.status !== 200) {
    throw new HttpError(
      400,
      'Invalid apiKey. Make sure this is a valid Steam Publisher Web API Key.',
    );
  }

  const app = response.data.applist?.apps?.app?.find((a) => a.appid === applicationId);
  if (!app) {
    throw new HttpError(
      400,
      'Invalid applicationId. ' +
        'Make sure the Steam Publisher Web API Key has ownership of this App ID.',
    );
  }

  const context = {
    credentials: { ...ctx.state },
    Model: SteamIntegrationModel,
    options: SteamIntegrationPermissionOptions,
  };
  const result = await permissions.create(context, ctx.request.body, ctx.params);
  const record = await permissions.read(context, result);

  ctx.response.body = { record };
}

export const dependencies = { getPartnerAppListForWebApiKey: steam.getPartnerAppListForWebApiKey };
