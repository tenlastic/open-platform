import { request } from '../request';

export interface AuthenticateUserTicketOptions {
  appid: number;
  key: string;
  ticket: string;
}

export interface AuthenticateUserTicketResponse {
  response: {
    error: {
      errorcode: number;
      errordesc: string;
    };
    params: {
      ownersteamid: string;
      publisherbanned: boolean;
      result: string;
      steamid: string;
      vacbanned: boolean;
    };
  };
}

export async function authenticateUserTicket(options: AuthenticateUserTicketOptions) {
  const method = 'get';
  const params = { appid: options.appid, key: options.key, ticket: options.ticket };
  const url = `https://partner.steam-api.com/ISteamUserAuth/AuthenticateUserTicket/v1`;

  return request<AuthenticateUserTicketResponse>({ method, params, url });
}
