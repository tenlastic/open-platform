export let accessToken: string;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(value: string) {
  accessToken = value;
}
