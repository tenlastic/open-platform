import * as docker from '@tenlastic/docker-engine';
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
import * as sinon from 'sinon';

import {
  BuildReleaseDockerImage,
  CopyReleaseFiles,
  CreateCollectionIndex,
  DeleteCollectionIndex,
  DeleteReleaseFiles,
  UnzipReleaseFiles,
} from './';

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
    databaseName: `rabbitmq-models-test`,
  });

  await rabbitmq.connect({ url: process.env.RABBITMQ_CONNECTION_STRING });
});

beforeEach(async function() {
  sandbox = sinon.createSandbox();

  // Do not create Game Server resources within Kubernetes.
  sandbox.stub(GameServer.prototype, 'createKubernetesResources').resolves();
  sandbox.stub(GameServer.prototype, 'deleteKubernetesResources').resolves();
  sandbox.stub(GameServer.prototype, 'updateKubernetesResources').resolves();

  await Article.deleteMany({});
  await Collection.deleteMany({});
  await Connection.deleteMany({});
  await Database.deleteMany({});
  await File.deleteMany({});
  await Friend.deleteMany({});
  await Game.deleteMany({});
  await GameInvitation.deleteMany({});
  await GameServer.deleteMany({});
  await Group.deleteMany({});
  await GroupInvitation.deleteMany({});
  await Ignoration.deleteMany({});
  await Log.deleteMany({});
  await Match.deleteMany({});
  await Message.deleteMany({});
  await Namespace.deleteMany({});
  await PasswordReset.deleteMany({});
  await Queue.deleteMany({});
  await QueueMember.deleteMany({});
  await RefreshToken.deleteMany({});
  await Release.deleteMany({});
  await ReleaseTask.deleteMany({});
  await User.deleteMany({});

  await BuildReleaseDockerImage.purge();
  await CopyReleaseFiles.purge();
  await CreateCollectionIndex.purge();
  await DeleteCollectionIndex.purge();
  await DeleteReleaseFiles.purge();
  await UnzipReleaseFiles.purge();
});

afterEach(function() {
  sandbox.restore();
});
