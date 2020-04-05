import * as request from 'request-promise-native';

import { configuration, getDefaultRequestOptions } from '../init';

export async function push(image: string, tag: string) {
  const options = getDefaultRequestOptions();

  const url = new URL(configuration.registryUrl);
  const repo = `${url.host}/${image}`;

  return request.post({
    ...options,
    url: `${configuration.url}/images/${repo}/push?tag=${tag}`,
  });
}
