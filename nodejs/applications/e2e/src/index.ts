import dependencies from './dependencies';

export let administratorAccessToken: string;
export let administratorRefreshToken: string;

before(async function () {
  const password = process.env.E2E_ADMINISTRATOR_PASSWORD;
  const username = process.env.E2E_ADMINISTRATOR_USERNAME;

  const { accessToken, refreshToken } = await dependencies.loginService.createWithCredentials(
    username,
    password,
  );

  dependencies.tokenService.setAccessToken(accessToken);
  dependencies.tokenService.setRefreshToken(refreshToken);

  administratorAccessToken = accessToken;
  administratorRefreshToken = refreshToken;
});

after(async function () {
  await dependencies.loginService.delete();
});
