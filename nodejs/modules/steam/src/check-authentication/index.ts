import { request } from '../request';

export interface CheckAuthenticationOptions {
  assocHandle: string;
  claimedId: string;
  identity: string;
  responseNonce: string;
  returnTo: string;
  sig: string;
  signed: string;
}

export interface CheckAuthenticationRequest {
  'openid.assoc_handle': string;
  'openid.claimed_id': string;
  'openid.identity': string;
  'openid.mode': 'check_authentication';
  'openid.ns': 'http://specs.openid.net/auth/2.0';
  'openid.op_endpoint': 'https://steamcommunity.com/openid/login';
  'openid.response_nonce': string;
  'openid.return_to': string;
  'openid.sig': string;
  'openid.signed': string;
}

export async function checkAuthentication(options: CheckAuthenticationOptions) {
  const method = 'get';
  const params: CheckAuthenticationRequest = {
    'openid.assoc_handle': options.assocHandle,
    'openid.claimed_id': options.claimedId,
    'openid.identity': options.identity,
    'openid.mode': 'check_authentication',
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.op_endpoint': 'https://steamcommunity.com/openid/login',
    'openid.response_nonce': options.responseNonce,
    'openid.return_to': options.returnTo,
    'openid.sig': options.sig,
    'openid.signed': options.signed,
  };
  const url = `https://steamcommunity.com/openid/login`;

  const response = await request<CheckAuthenticationRequest, string>({ method, params, url });

  return response.data?.includes('is_valid:true');
}
