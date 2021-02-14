export async function delete(
  buildId: string,
  path: string,
  platform: string,
  previousBuildId: string,
) {
  path = path.replace(/[\.]+\//g, '');

  const response = await requestPromiseNative.get({
    headers: { Authorization: `Bearer: ${accessToken}` },
    json: true,
    qs: { query: JSON.stringify({ where: { path } }) },
    url: `http://api.default:3000/builds/${buildId}/platforms/${platform}/files`,
  });
  const file = response.records[0];

  return requestPromiseNative.delete({
    headers: { Authorization: `Bearer: ${accessToken}` },
    json: true,
    url: `http://api.default:3000/builds/${buildId}/platforms/${platform}/files/${file._id}`,
  });
}