import * as jsonwebtoken from 'jsonwebtoken';
import * as requestPromiseNative from 'request-promise-native';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

export type RequestMethod = 'delete' | 'get' | 'post' | 'put';

export interface RequestOptions {
  jwt?: string;
  user?: any;
}

export function request(
  method: RequestMethod,
  path: string,
  params?: any,
  options?: RequestOptions,
) {
  let url = BASE_URL + path;

  if (params && (method === 'delete' || method === 'get')) {
    const queryString = JSON.stringify(params);
    url += `?query=${queryString}`;
  }

  const headers: any = {};

  if (options) {
    let jwt = options.jwt;

    if (options.user) {
      jwt = jsonwebtoken.sign({ user: options.user }, process.env.JWT_SECRET);
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
