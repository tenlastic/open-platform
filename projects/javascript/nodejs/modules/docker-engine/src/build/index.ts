import * as request from 'request-promise-native';
import * as tar from 'tar';

import { configuration, getDefaultRequestOptions } from '../init';

export async function build(dir: string, files: string[], image: string, tag: string) {
  const options = getDefaultRequestOptions();
  const stream = tar.create({ cwd: dir }, files);

  return request.post({
    ...options,
    body: stream,
    url: `${configuration.url}/build?t=${image}:${tag}`,
  });
}
