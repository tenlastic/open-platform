import * as minio from '@tenlastic/minio';
import * as mongooseModels from '@tenlastic/mongoose-models';
import { URL } from 'url';

before(async function() {
  const minioConnectionUrl = new URL(process.env.MINIO_CONNECTION_STRING);
  minio.connect({
    accessKey: minioConnectionUrl.username,
    endPoint: minioConnectionUrl.hostname,
    port: Number(minioConnectionUrl.port || '443'),
    secretKey: minioConnectionUrl.password,
    useSSL: minioConnectionUrl.protocol === 'https:',
  });

  const bucket = process.env.MINIO_BUCKET;
  const bucketExists = await minio.bucketExists(bucket);
  if (!bucketExists) {
    await minio.makeBucket(bucket);
  }

  await mongooseModels.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `build`,
  });
  await mongooseModels.syncIndexes();
});

beforeEach(async function() {
  await mongooseModels.deleteAll();
});
