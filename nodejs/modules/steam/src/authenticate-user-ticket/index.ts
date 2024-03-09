import { request } from '../request';

export interface AuthenticateUserTicketOptions {
  appid: number;
  key: string;
  ticket: string;
}

export interface AuthenticateUserTicketResponse {
  response: {
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
  const { appid, key, ticket } = options;

  const method = 'get';
  const params = { appid, key, ticket };
  const url = `https://partner.steam-api.com/ISteamUserAuth/AuthenticateUserTicket/v1`;

  return request<AuthenticateUserTicketResponse>({ method, params, url });
}
