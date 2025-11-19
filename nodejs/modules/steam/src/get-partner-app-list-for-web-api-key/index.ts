import { request } from '../request';

export interface GetPartnerAppListForWebApiKeyOptions {
  key: string;
}

export interface GetPartnerAppListForWebApiKeyRequest {
  key: string;
}

export interface GetPartnerAppListForWebApiKeyResponse {
  applist: {
    apps: {
      app: [
        {
          app_name: string;
          app_type: string;
          appid: number;
        },
      ];
    };
  };
}

export async function getPartnerAppListForWebApiKey(options: GetPartnerAppListForWebApiKeyOptions) {
  const method = 'get';
  const params: GetPartnerAppListForWebApiKeyRequest = { key: options.key };
  const url = `https://partner.steam-api.com/ISteamApps/GetPartnerAppListForWebAPIKey/v2`;

  return request<GetPartnerAppListForWebApiKeyRequest, GetPartnerAppListForWebApiKeyResponse>({
    method,
    params,
    url,
  });
}
