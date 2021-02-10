import 'source-map-support/register';

import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongooseModels from '@tenlastic/mongoose-models';
import { File, FilePlatform } from '@tenlastic/mongoose-models';
import * as minio from '@tenlastic/minio';

import { copy } from './copy';
import { unzip } from './unzip';

const buildId = process.env.BUILD_ID;
const deleted: string[] = JSON.parse(process.env.DELETED);
const platform = process.env.PLATFORM;
const previousBuildId = process.env.PREVIOUS_BUILD_ID;
const unmodified: string[] = JSON.parse(process.env.UNMODIFIED);
const zip = process.env.ZIP;

(async () => {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING);

  const minioConnectionUrl = new URL(process.env.MINIO_CONNECTION_STRING);
  minio.connect({
    accessKey: minioConnectionUrl.username,
    endPoint: minioConnectionUrl.hostname,
    port: Number(minioConnectionUrl.port || '443'),
    secretKey: minioConnectionUrl.password,
    useSSL: minioConnectionUrl.protocol === 'https:',
  });

  await mongooseModels.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `api`,
  });

  // Copy unmodified Files from previous Build.
  const copyPromises = unmodified.map(u => copy(buildId, u, platform, previousBuildId));
  await Promise.all(copyPromises);

  // Delete removed Files from Build.
  const deletePromises = deleted.map(d => {
    const path = d.replace(/[\.]+\//g, '');
    return File.findOneAndDelete({ buildId, path, platform });
  });
  await Promise.all(deletePromises);

  // Unzip modified Files.
  const stream = await minio.getObject(process.env.MINIO_BUCKET, zip);
  await unzip(buildId, platform as FilePlatform, stream);
  await minio.removeObject(process.env.MINIO_BUCKET, zip);
})();
