import { request } from '../request';

export interface CheckAppOwnershipOptions {
  appId: number;
  key: string;
  steamId: string;
}

export interface CheckAppOwnershipResponse {
  appownership: {
    ownersteamid: string;
    ownsapp: boolean;
    permanent: boolean;
    result: string;
    sitelicense: boolean;
    timedtrial: boolean;
    timestamp: string;
  };
}

export async function checkAppOwnership(options: CheckAppOwnershipOptions) {
  const method = 'get';
  const params = { appid: options.appId, key: options.key, steamid: options.steamId };
  const url = `https://partner.steam-api.com/ISteamUser/CheckAppOwnership/v2`;

  return request<CheckAppOwnershipResponse>({ method, params, url });
}
