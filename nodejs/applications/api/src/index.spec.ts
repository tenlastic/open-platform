import mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as mongooseModels from '@tenlastic/mongoose-models';
import * as sinon from 'sinon';
import { URL } from 'url';

let sandbox: sinon.SinonSandbox;

before(async function () {
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
    databaseName: `api-test`,
  });
  await mongooseModels.syncIndexes();
});

beforeEach(async function () {
  sandbox = sinon.createSandbox();
  mailgun.stub(sandbox);

  await mongooseModels.deleteAll();
});

afterEach(function () {
  sandbox.restore();
});
