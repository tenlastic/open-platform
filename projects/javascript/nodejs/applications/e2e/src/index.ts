import { loginService, setAccessToken, setApiUrl, setRefreshToken } from '@tenlastic/http';

const apiUrl = process.env.E2E_API_URL;
setApiUrl(apiUrl);

before(async function() {
  const password = process.env.E2E_ADMINISTRATOR_PASSWORD;
  const username = process.env.E2E_ADMINISTRATOR_USERNAME;

  const response = await loginService.createWithCredentials(username, password);
  setAccessToken(response.accessToken);
  setRefreshToken(response.refreshToken);
});

after(async function() {
  await loginService.delete();
});
