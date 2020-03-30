import * as request from 'request-promise-native';

import { configuration, getDefaultRequestOptions } from '../init';

export async function inspect(image: string, tag: string) {
  const options = getDefaultRequestOptions();

  return request.get({
    ...options,
    json: true,
    url: `${configuration.url}/images/json?filters={"reference":["${image}:${tag}"]}`,
  });
}
