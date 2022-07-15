import * as request from 'request';
import * as requestPromiseNative from 'request-promise-native';

import { getApiKey } from '../api-key';
import { getAccessToken } from '../tokens';

export async function promise(url: string, options?: requestPromiseNative.RequestPromiseOptions) {
  const headers = await getHeaders(url, options);
  return requestPromiseNative(url, { ...options, headers: { ...headers, ...options.headers } });
}

export async function stream(url: string, options?: request.CoreOptions) {
  const headers = await getHeaders(url, options);
  return request(url, { ...options, headers: { ...headers, ...options.headers } });
}

async function getHeaders(url: string, options?: request.CoreOptions) {
  const headers: request.Headers = {};

  if (!options.form && !options.formData) {
    headers['Content-Type'] = 'application/json';
  }

  const apiKey = getApiKey();
  if (apiKey) {
    headers['X-Api-Key'] = apiKey;
  } else if (!url.includes('/logins/refresh-token')) {
    const accessToken = await getAccessToken();
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}
