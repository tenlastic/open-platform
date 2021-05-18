import { loginService, setAccessToken, setApiUrl, setRefreshToken } from '@tenlastic/http';

const apiUrl = process.env.E2E_API_URL;
setApiUrl(apiUrl);

beforeEach(async function() {
  const password = process.env.E2E_ADMINISTRATOR_PASSWORD;
  const username = process.env.E2E_ADMINISTRATOR_USERNAME;

  const response = await loginService.createWithCredentials(username, password);
  setAccessToken(response.accessToken);
  setRefreshToken(response.refreshToken);
});

afterEach(async function() {
  await loginService.delete();
});
