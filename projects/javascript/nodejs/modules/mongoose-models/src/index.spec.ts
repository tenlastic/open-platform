import * as mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { connect, deleteAll } from './';

let sandbox: sinon.SinonSandbox;

before(async function() {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));

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

beforeEach(async function() {
  sandbox = sinon.createSandbox();
  sandbox.stub(mailgun, 'send').resolves();

  await deleteAll();
});

afterEach(function() {
  sandbox.restore();
});
