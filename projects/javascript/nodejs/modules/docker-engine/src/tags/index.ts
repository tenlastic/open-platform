import * as request from 'request-promise-native';

import { configuration, getDefaultRequestOptions } from '../init';

export async function tags(image: string) {
  const options = getDefaultRequestOptions();

  return request.get({
    ...options,
    json: true,
    url: `${configuration.url}/v2/${image}/tags/list`,
  });
}
