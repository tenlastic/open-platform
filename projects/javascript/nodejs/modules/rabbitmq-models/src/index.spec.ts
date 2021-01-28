import * as docker from '@tenlastic/docker-engine';
import * as minio from '@tenlastic/minio';
import * as mongooseModels from '@tenlastic/mongoose-models';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as rabbitmq from '@tenlastic/rabbitmq';
import * as sinon from 'sinon';

import { deleteAll } from './';

let sandbox: sinon.SinonSandbox;

before(async function() {
  docker.init({
    certPath: process.env.DOCKER_CERT_PATH,
    registryUrl: process.env.DOCKER_REGISTRY_URL,
    url: process.env.DOCKER_ENGINE_URL,
  });

  await kafka.connect(process.env.KAFKA_CONNECTION_STRING);

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
    databaseName: `rabbitmq-models-test`,
  });
  await mongooseModels.syncIndexes();

  await rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });
});

beforeEach(async function() {
  sandbox = sinon.createSandbox();
  mongooseModels.stub(sandbox);

  await mongooseModels.deleteAll();
  await deleteAll();
});

afterEach(function() {
  sandbox.restore();
});
