import * as requestPromiseNative from 'request-promise-native';

export async function getRemoteFiles(
  apiKey: string,
  buildId: string,
  host: string,
  platform: string,
) {
  const response = await requestPromiseNative.get({
    headers: { 'X-Api-Key': apiKey },
    json: true,
    url: `${host}/builds/${buildId}/platforms/${platform}/files`,
  });

  return response.records;
}
