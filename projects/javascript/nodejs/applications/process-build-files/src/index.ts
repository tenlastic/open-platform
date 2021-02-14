import 'source-map-support/register';

import { File, FilePlatform } from '@tenlastic/mongoose-models';
import * as minio from '@tenlastic/minio';
import * as requestPromiseNative from 'request-promise-native';

import { copy } from './copy';
import { unzip } from './unzip';

const accessToken = process.env.ACCESS_TOKEN;
const buildId = process.env.BUILD_ID;
const deleted: string[] = JSON.parse(process.env.DELETED);
const minioConnectionString = process.env.MINIO_CONNECTION_STRING;
const platform = process.env.PLATFORM;
const previousBuildId = process.env.PREVIOUS_BUILD_ID;
const unmodified: string[] = JSON.parse(process.env.UNMODIFIED);
const zip = process.env.ZIP;

(async () => {
  const minioConnectionUrl = new URL(minioConnectionString);
  minio.connect({
    accessKey: minioConnectionUrl.username,
    endPoint: minioConnectionUrl.hostname,
    port: Number(minioConnectionUrl.port || '443'),
    secretKey: minioConnectionUrl.password,
    useSSL: minioConnectionUrl.protocol === 'https:',
  });

  // Copy unmodified Files from previous Build.
  const copyPromises = unmodified.map(u => copy(buildId, u, platform, previousBuildId));
  await Promise.all(copyPromises);

  // Delete removed Files from Build.
  const deletePromises = deleted.map(async d => {
    const path = d.replace(/[\.]+\//g, '');

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
  });
  await Promise.all(deletePromises);

  // Unzip modified Files.
  const stream = await minio.getObject(process.env.MINIO_BUCKET, zip);
  await unzip(buildId, platform as FilePlatform, stream);
  await minio.removeObject(process.env.MINIO_BUCKET, zip);
})();
