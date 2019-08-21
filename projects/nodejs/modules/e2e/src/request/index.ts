import * as jsonwebtoken from 'jsonwebtoken';
import * as requestPromiseNative from 'request-promise-native';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3000';

export type RequestMethod = 'delete' | 'get' | 'post' | 'put';

export function request(method: RequestMethod, path: string, params?: any, user?: any) {
  let url = BASE_URL + path;

  if (params && (method === 'delete' || method === 'get')) {
    const queryString = JSON.stringify(params);
    url += `?query=${queryString}`;
  }

  let headers: any = {};
  if (user) {
    const jwt = jsonwebtoken.sign({ user }, process.env.JWT_SECRET);
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
