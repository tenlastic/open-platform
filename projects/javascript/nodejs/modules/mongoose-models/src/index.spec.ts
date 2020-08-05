import * as mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

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
} from './models';

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

  const bucketExists = await minio.bucketExists(process.env.MINIO_BUCKET);
  if (!bucketExists) {
    await minio.makeBucket(process.env.MINIO_BUCKET);
  }

  await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
    dbName: `mongoose-models-test`,
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
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
});

afterEach(function() {
  sandbox.restore();
});
