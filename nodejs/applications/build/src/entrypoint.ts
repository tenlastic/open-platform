import 'source-map-support/register';
import '@tenlastic/logging';

import { BuildModel, IBuild } from '@tenlastic/http';
import * as minio from '@tenlastic/minio';
import * as path from 'path';
import { URL } from 'url';

import { copy } from './copy';
import { unzip } from './unzip';
import dependencies from './dependencies';

const buildId = process.env.BUILD_ID;
const minioBucket = process.env.MINIO_BUCKET;
const minioConnectionString = process.env.MINIO_CONNECTION_STRING;
const namespaceId = process.env.NAMESPACE_ID;

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
    const build = await dependencies.buildService.findOne(namespaceId, buildId);

    // Copy unmodified Files from previous Build.
    if (build.reference) {
      let referenceBuild: BuildModel;
      try {
        referenceBuild = await dependencies.buildService.findOne(namespaceId, build.reference._id);
      } catch {
        throw new Error(`Reference Build ${buildId} not found.`);
      }

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
          await new Promise((res) => setTimeout(res, 5000));
        } else {
          console.error(e.message);
          throw e;
        }
      }
    }

    // Update the Build.
    await dependencies.buildService.update(namespaceId, buildId, { files: build.files });

    // If building a server, download files for Docker.
    if (build.platform === IBuild.Platform.Server64) {
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
