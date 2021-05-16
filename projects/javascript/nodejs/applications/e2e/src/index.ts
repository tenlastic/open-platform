import { loginService, setAccessToken } from '@tenlastic/http';

beforeEach(async function() {
  const password = process.env.E2E_ADMINISTRATOR_PASSWORD;
  const username = process.env.E2E_ADMINISTRATOR_USERNAME;

  const response = await loginService.createWithCredentials(username, password);
  setAccessToken(response.accessToken);
});

afterEach(async function() {
  await loginService.delete();
});
