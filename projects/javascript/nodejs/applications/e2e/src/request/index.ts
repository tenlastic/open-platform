import * as jsonwebtoken from 'jsonwebtoken';
import * as requestPromiseNative from 'request-promise-native';

import { getAccessToken } from '../log-in';

export type RequestMethod = 'delete' | 'get' | 'post' | 'put';

export interface RequestOptions {
  jwt?: string;
  user?: any;
}

export function request(
  host: string,
  method: RequestMethod,
  path: string,
  params?: any,
  options?: RequestOptions,
) {
  let url = host + path;

  if (params && (method === 'delete' || method === 'get')) {
    const queryString = JSON.stringify(params);
    url += `?query=${queryString}`;
  }

  const accessToken = getAccessToken();
  const headers = { authorization: `Bearer ${accessToken}` };

  if (options) {
    let jwt = options.jwt;

    if (options.user) {
      jwt = jsonwebtoken.sign({ user: options.user }, process.env.JWT_PRIVATE_KEY, {
        algorithm: 'RS256',
      });
    }

    headers.authorization = `Bearer ${jwt}`;
  }

  const defaults = { headers, json: true, resolveWithFullResponse: true, simple: false, url };

  switch (method) {
    case 'delete':
      return requestPromiseNative.del(defaults);
    case 'get':
      return requestPromiseNative.get(defaults);
    case 'post':
      return requestPromiseNative.post({ ...defaults, body: params });
    case 'put':
      return requestPromiseNative.put({ ...defaults, body: params });
  }
}
