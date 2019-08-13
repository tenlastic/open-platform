import { sign } from 'jsonwebtoken';
import { del, get, post, put } from 'request-promise-native';

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
    const jwt = sign({ user }, process.env.JWT_SECRET);
    headers.authorization = `Bearer ${jwt}`;
  }

  const defaults = { headers, json: true, resolveWithFullResponse: true, simple: false, url };

  switch (method) {
    case 'delete':
      return del(defaults);
    case 'get':
      return get(defaults);
    case 'post':
      return post({ ...defaults, body: params });
    case 'put':
      return put({ ...defaults, body: params });
  }
}
