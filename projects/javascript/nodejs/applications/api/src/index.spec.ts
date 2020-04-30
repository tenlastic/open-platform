import * as docker from '@tenlastic/docker-engine';
import * as mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as rabbitmq from '@tenlastic/rabbitmq';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { MINIO_BUCKET, MONGO_DATABASE_NAME } from './constants';
import {
  Article,
  Collection,
  Connection,
  Database,
  File,
  Friend,
  Game,
  GameServer,
  Ignoration,
  Message,
  Namespace,
  PasswordReset,
  RefreshToken,
  Release,
  ReleaseTask,
  User,
} from './models';
import {
  BUILD_RELEASE_SERVER_QUEUE,
  COPY_RELEASE_FILES_QUEUE,
  CREATE_COLLECTION_INDEX_QUEUE,
  DELETE_COLLECTION_INDEX_QUEUE,
  REMOVE_RELEASE_FILES_QUEUE,
  UNZIP_RELEASE_FILES_QUEUE,
} from './workers';

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

  const bucketExists = await minio.getClient().bucketExists(MINIO_BUCKET);
  if (!bucketExists) {
    await minio.getClient().makeBucket(MINIO_BUCKET, 'us-east-1');
  }

  await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
    dbName: `${MONGO_DATABASE_NAME}-test`,
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });
});

beforeEach(async function() {
  sandbox = sinon.createSandbox();
  sandbox.stub(mailgun, 'send').resolves();

  await Article.deleteMany({});
  await Collection.deleteMany({});
  await Connection.deleteMany({});
  await Database.deleteMany({});
  await File.deleteMany({});
  await Friend.deleteMany({});
  await Game.deleteMany({});
  await GameServer.deleteMany({});
  await Ignoration.deleteMany({});
  await Message.deleteMany({});
  await Namespace.deleteMany({});
  await PasswordReset.deleteMany({});
  await RefreshToken.deleteMany({});
  await Release.deleteMany({});
  await ReleaseTask.deleteMany({});
  await User.deleteMany({});

  await rabbitmq.purge(BUILD_RELEASE_SERVER_QUEUE);
  await rabbitmq.purge(COPY_RELEASE_FILES_QUEUE);
  await rabbitmq.purge(CREATE_COLLECTION_INDEX_QUEUE);
  await rabbitmq.purge(DELETE_COLLECTION_INDEX_QUEUE);
  await rabbitmq.purge(REMOVE_RELEASE_FILES_QUEUE);
  await rabbitmq.purge(UNZIP_RELEASE_FILES_QUEUE);
});

afterEach(function() {
  sandbox.restore();
});
