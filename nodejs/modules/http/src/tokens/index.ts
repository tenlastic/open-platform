import wait from '@tenlastic/wait';

import { Jwt } from '../jwt';
import { loginService } from '../services/login';

export class ExpiredRefreshTokenError extends Error {}

let accessToken: Jwt;
let isRefreshingAccessToken = false;
let refreshToken: Jwt;

export async function getAccessToken() {
  await wait(250, 5000, () => !isRefreshingAccessToken);

  // If the access token is still valid, return it.
  if (accessToken && !accessToken.isExpired) {
    return accessToken.value;
  }

  // If we do not have a refresh token, return nothing.
  if (!refreshToken) {
    return null;
  }

  // If the refresh token is set, but is expired, throw an error.
  if (refreshToken.isExpired) {
    throw new ExpiredRefreshTokenError();
  }

  isRefreshingAccessToken = true;

  try {
    const response = await loginService.createWithRefreshToken(refreshToken.value);
    setAccessToken(response.accessToken);
  } catch {
    throw new ExpiredRefreshTokenError();
  }

  isRefreshingAccessToken = false;

  return accessToken.value;
}

export function getRefreshToken() {
  return refreshToken.value;
}

export function setAccessToken(value: string) {
  accessToken = new Jwt(value);
}

export function setRefreshToken(value: string) {
  refreshToken = new Jwt(value);
}
