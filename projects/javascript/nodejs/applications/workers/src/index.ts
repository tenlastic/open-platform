import 'source-map-support/register';

import * as docker from '@tenlastic/docker-engine';
import '@tenlastic/logging';
import * as mongoose from '@tenlastic/mongoose-models';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as minio from '@tenlastic/minio';
import * as rabbitmq from '@tenlastic/rabbitmq';
import {
  BuildReleaseDockerImage,
  CopyReleaseFiles,
  CreateCollectionIndex,
  DeleteCollectionIndex,
  DeleteReleaseFiles,
  UnzipReleaseFiles,
} from '@tenlastic/rabbitmq-models';
import { WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

// Docker Engine.
docker.init({
  certPath: process.env.DOCKER_CERT_PATH,
  registryUrl: process.env.DOCKER_REGISTRY_URL,
  url: process.env.DOCKER_ENGINE_URL,
});

// Kafka.
(async () => {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
})();

// Minio.
(async () => {
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
})();

// MongoDB.
mongoose.connect({
  connectionString: process.env.MONGO_CONNECTION_STRING,
  databaseName: 'api',
});

// RabbitMQ.
(async () => {
  await rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });

  BuildReleaseDockerImage.subscribe();
  CopyReleaseFiles.subscribe();
  CreateCollectionIndex.subscribe();
  DeleteCollectionIndex.subscribe();
  DeleteReleaseFiles.subscribe();
  UnzipReleaseFiles.subscribe();
})();

// Web Server.
const router = new Router();
router.get('/', ctx => (ctx.status = 200));
const webServer = new WebServer();
webServer.use(router.routes());
webServer.start();
