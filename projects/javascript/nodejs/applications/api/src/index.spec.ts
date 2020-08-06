import * as docker from '@tenlastic/docker-engine';
import * as mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as mongoose from '@tenlastic/mongoose-models';
import {
  Article,
  Collection,
  Connection,
  Database,
  File,
  Friend,
  Game,
  GameInvitation,
  GameServer,
  Group,
  GroupInvitation,
  Ignoration,
  Log,
  Match,
  Message,
  Namespace,
  PasswordReset,
  Queue,
  QueueMember,
  RefreshToken,
  Release,
  ReleaseTask,
  User,
} from '@tenlastic/mongoose-models';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as rabbitmq from '@tenlastic/rabbitmq';
import {
  BuildReleaseDockerImage,
  CopyReleaseFiles,
  CreateCollectionIndex,
  DeleteCollectionIndex,
  DeleteReleaseFiles,
  UnzipReleaseFiles,
} from '@tenlastic/rabbitmq-models';
import * as sinon from 'sinon';

import { MONGO_DATABASE_NAME } from './constants';

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

  await mongoose.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `${MONGO_DATABASE_NAME}-test`,
  });

  await rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });
});

beforeEach(function() {
  sandbox = sinon.createSandbox();

  // Do not send Mailgun emails.
  sandbox.stub(mailgun, 'send').resolves();

  // Do not create Game Server resources within Kubernetes.
  sandbox.stub(GameServer.prototype, 'createKubernetesResources').resolves();
  sandbox.stub(GameServer.prototype, 'deleteKubernetesResources').resolves();
  sandbox.stub(GameServer.prototype, 'updateKubernetesResources').resolves();

  return Promise.all<any>([
    Article.deleteMany({}),
    Collection.deleteMany({}),
    Connection.deleteMany({}),
    Database.deleteMany({}),
    File.deleteMany({}),
    Friend.deleteMany({}),
    Game.deleteMany({}),
    GameInvitation.deleteMany({}),
    GameServer.deleteMany({}),
    Group.deleteMany({}),
    GroupInvitation.deleteMany({}),
    Ignoration.deleteMany({}),
    Log.deleteMany({}),
    Match.deleteMany({}),
    Message.deleteMany({}),
    Namespace.deleteMany({}),
    PasswordReset.deleteMany({}),
    Queue.deleteMany({}),
    QueueMember.deleteMany({}),
    RefreshToken.deleteMany({}),
    Release.deleteMany({}),
    ReleaseTask.deleteMany({}),
    User.deleteMany({}),

    BuildReleaseDockerImage.purge(),
    CopyReleaseFiles.purge(),
    CreateCollectionIndex.purge(),
    DeleteCollectionIndex.purge(),
    DeleteReleaseFiles.purge(),
    UnzipReleaseFiles.purge(),
  ]);
});

afterEach(function() {
  sandbox.restore();
});
