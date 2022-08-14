import dependencies from './dependencies';

before(async function () {
  const password = process.env.E2E_ADMINISTRATOR_PASSWORD;
  const username = process.env.E2E_ADMINISTRATOR_USERNAME;

  const response = await dependencies.loginService.createWithCredentials(username, password);
  dependencies.tokenService.setAccessToken(response.accessToken);
  dependencies.tokenService.setRefreshToken(response.refreshToken);
});

after(async function () {
  await dependencies.loginService.delete();
});
