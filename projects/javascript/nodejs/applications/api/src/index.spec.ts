import * as docker from '@tenlastic/docker-engine';
import * as mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as mongooseModels from '@tenlastic/mongoose-models';
import { GameServer } from '@tenlastic/mongoose-models';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as rabbitmq from '@tenlastic/rabbitmq';
import * as rabbitmqModels from '@tenlastic/rabbitmq-models';
import * as sinon from 'sinon';

let sandbox: sinon.SinonSandbox;

before(async function() {
  docker.init({
    certPath: process.env.DOCKER_CERT_PATH,
    registryUrl: process.env.DOCKER_REGISTRY_URL,
    url: process.env.DOCKER_ENGINE_URL,
  });

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

  await mongooseModels.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `api-test`,
  });

  await rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });
});

beforeEach(async function() {
  sandbox = sinon.createSandbox();

  // Do not send Mailgun emails.
  sandbox.stub(mailgun, 'send').resolves();

  // Do not create Game Server resources within Kubernetes.
  sandbox.stub(GameServer.prototype, 'createKubernetesResources').resolves();
  sandbox.stub(GameServer.prototype, 'deleteKubernetesResources').resolves();
  sandbox.stub(GameServer.prototype, 'updateKubernetesResources').resolves();

  await mongooseModels.deleteAll();
  await rabbitmqModels.deleteAll();
});

afterEach(function() {
  sandbox.restore();
});
