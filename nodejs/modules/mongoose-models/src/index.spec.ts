import mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as sinon from 'sinon';
import { URL } from 'url';

import { connect } from './connect';
import { deleteAll } from './delete-all';

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

  await connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'mongoose-models-test',
  });
});

beforeEach(async function () {
  sandbox = sinon.createSandbox();
  mailgun.stub(sandbox);

  await deleteAll();
});

afterEach(function () {
  sandbox.restore();
});
