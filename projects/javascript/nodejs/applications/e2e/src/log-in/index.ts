import { UserModel } from '../models';
import { request } from '../request';

const HOST_AUTHENTICATION_API = process.env.E2E_HOST_AUTHENTICATION_API;

let accessToken: string;
let refreshToken: string;

export function getAccessToken() {
  return accessToken;
}

export function getRefreshToken() {
  return refreshToken;
}

export async function logIn() {
  if (accessToken && refreshToken) {
    return { accessToken, refreshToken };
  }

  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  try {
    await UserModel.create({ email, password, username: 'e2e' });
  } catch {}

  const response = await request(HOST_AUTHENTICATION_API, 'post', '/logins', {
    email,
    password,
  });

  accessToken = response.body.accessToken;
  refreshToken = response.body.refreshToken;

  return { accessToken, refreshToken };
}
