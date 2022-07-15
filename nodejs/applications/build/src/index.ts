import 'source-map-support/register';

import { Build } from '@tenlastic/mongoose-models';
import * as minio from '@tenlastic/minio';
import * as path from 'path';
import * as requestPromiseNative from 'request-promise-native';
import { URL } from 'url';

import { copy } from './copy';
import { unzip } from './unzip';

const apiKey = process.env.API_KEY;
const buildId = process.env.BUILD_ID;
const minioBucket = process.env.MINIO_BUCKET;
const minioConnectionString = process.env.MINIO_CONNECTION_STRING;

const minioConnectionUrl = new URL(minioConnectionString);
minio.connect({
  accessKey: minioConnectionUrl.username,
  endPoint: minioConnectionUrl.hostname,
  port: Number(minioConnectionUrl.port || '443'),
  secretKey: minioConnectionUrl.password,
  useSSL: minioConnectionUrl.protocol === 'https:',
});

(async () => {
  try {
    const response = await requestPromiseNative.get({
      headers: { 'X-Api-Key': apiKey },
      json: true,
      url: `http://api.static:3000/builds/${buildId}`,
    });
    const build = new Build(response.record);

    // Copy unmodified Files from previous Build.
    if (build.reference) {
      const referenceBuildResponse = await requestPromiseNative.get({
        headers: { 'X-Api-Key': apiKey },
        json: true,
        url: `http://api.static:3000/builds/${build.reference._id}`,
      });
      if (!referenceBuildResponse.record) {
        throw new Error(`Reference Build ${buildId} not found.`);
      }

      const referenceBuild = new Build(referenceBuildResponse.record);
      const copyPromises = build.reference.files.map((f) => copy(build, f, referenceBuild));
      build.files = await Promise.all(copyPromises);
    }

    // Unzip modified Files.
    let retries = 0;

    while (retries++ < 3) {
      try {
        console.log(`Attempting to unzip file: ${build.getZipPath()}.`);

        const stream = await minio.getObject(minioBucket, build.getZipPath());
        const files = await unzip(build, stream);
        build.files = [].concat(build.files || [], files);

        console.log(`Finished unzipping file: ${build.getZipPath()}.`);

        break;
      } catch (e) {
        if (e.code === 'NoSuchKey') {
          console.error(`Could not find zip file: ${build.getZipPath()}.`);
        } else {
          console.error(e.message);
        }

        await new Promise((res) => setTimeout(res, 5000));
      }
    }

    // Update the Build.
    await requestPromiseNative.put({
      body: { files: build.files },
      headers: { 'X-Api-Key': apiKey },
      json: true,
      url: `http://api.static:3000/builds/${buildId}`,
    });

    await minio.removeObject(minioBucket, build.getZipPath());

    // If building a server, download files for Docker.
    if (build.platform === 'server64') {
      for (const file of build.files) {
        console.log(`Downloading file: ${file.path}.`);
        await minio.fGetObject(
          minioBucket,
          build.getFilePath(file.path),
          path.resolve('/workspace/', file.path),
        );
      }
    }

    process.exit();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
