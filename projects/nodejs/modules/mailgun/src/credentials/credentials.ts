const credentials = {
  domain: null,
  key: null,
};

export function getCredentials() {
  return credentials;
}

export function setCredentials(domain: string, key: string) {
  credentials.domain = domain;
  credentials.key = key;
}
