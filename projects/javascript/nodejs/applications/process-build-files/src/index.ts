import 'source-map-support/register';

import { Build } from '@tenlastic/mongoose-models';
import * as minio from '@tenlastic/minio';
import * as requestPromiseNative from 'request-promise-native';

import { copy } from './copy';
import { unzip } from './unzip';

const accessToken = process.env.ACCESS_TOKEN;
const buildId = process.env.BUILD_ID;
const minioConnectionString = process.env.MINIO_CONNECTION_STRING;

(async () => {
  const minioConnectionUrl = new URL(minioConnectionString);
  minio.connect({
    accessKey: minioConnectionUrl.username,
    endPoint: minioConnectionUrl.hostname,
    port: Number(minioConnectionUrl.port || '443'),
    secretKey: minioConnectionUrl.password,
    useSSL: minioConnectionUrl.protocol === 'https:',
  });

  const builds = await requestPromiseNative.get({
    headers: { Authorization: `Bearer: ${accessToken}` },
    json: true,
    url: `http://api.default:3000/builds/${buildId}`,
  });
  if (builds.records.length === 0) {
    throw new Error(`Build ${buildId} not found.`);
  }

  // Copy unmodified Files from previous Build.
  const build = new Build(builds.records[0]);
  if (build.reference) {
    const referenceBuilds = await requestPromiseNative.get({
      headers: { Authorization: `Bearer: ${accessToken}` },
      json: true,
      qs: { query: JSON.stringify({ where: { _id: buildId } }) },
      url: `http://api.default:3000/builds`,
    });
    if (referenceBuilds.records.length === 0) {
      throw new Error(`Reference Build ${buildId} not found.`);
    }

    const referenceBuild = new Build(referenceBuilds.records[0]);
    const copyPromises = build.reference.files.map(f => copy(build, f, referenceBuild));
    build.files = await Promise.all(copyPromises);
  }

  // Unzip modified Files.
  const stream = await minio.getObject(process.env.MINIO_BUCKET, build.getZipPath());
  const files = await unzip(build, stream);
  build.files = [].concat(build.files || [], files);

  // Update the Build.
  await requestPromiseNative.put({
    body: { files: build.files },
    headers: { Authorization: `Bearer: ${accessToken}` },
    json: true,
    url: `http://api.default:3000/builds/${buildId}`,
  });

  await minio.removeObject(process.env.MINIO_BUCKET, build.getZipPath());
})();
