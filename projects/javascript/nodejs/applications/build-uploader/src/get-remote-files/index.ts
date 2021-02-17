import * as requestPromiseNative from 'request-promise-native';

export async function getRemoteFiles(apiKey: string, host: string, platform: string) {
  const response = await requestPromiseNative.get({
    headers: { 'X-Api-Key': apiKey },
    json: true,
    qs: {
      query: JSON.stringify({ sort: '-publishedAt', where: { publishedAt: { $exists: true } } }),
    },
    url: `${host}/builds`,
  });

  return response.records.length ? response.records[0].files : [];
}
