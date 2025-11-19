import { request } from '../request';

export interface AuthenticateUserTicketOptions {
  appId: number;
  key: string;
  ticket: string;
}

export interface AuthenticateUserTicketRequest {
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
  const params: AuthenticateUserTicketRequest = {
    appid: options.appId,
    key: options.key,
    ticket: options.ticket,
  };
  const url = `https://partner.steam-api.com/ISteamUserAuth/AuthenticateUserTicket/v1`;

  return request<AuthenticateUserTicketRequest, AuthenticateUserTicketResponse>({
    method,
    params,
    url,
  });
}
