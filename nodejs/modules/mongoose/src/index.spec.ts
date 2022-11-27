import { connect } from './connect';
import {
  Article,
  Authorization,
  AuthorizationRequest,
  Build,
  Collection,
  Friend,
  GameServer,
  Group,
  GroupInvitation,
  Ignoration,
  Login,
  Message,
  Namespace,
  PasswordReset,
  Queue,
  QueueMember,
  RefreshToken,
  Storefront,
  User,
  WebSocket,
  Workflow,
} from './models';

before(async function () {
  await connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'mongoose',
  });
  await Promise.all([
    Article.syncIndexes(),
    Authorization.syncIndexes(),
    AuthorizationRequest.syncIndexes(),
    Build.syncIndexes(),
    Collection.syncIndexes(),
    Friend.syncIndexes(),
    GameServer.syncIndexes(),
    Group.syncIndexes(),
    GroupInvitation.syncIndexes(),
    Ignoration.syncIndexes(),
    Login.syncIndexes(),
    Message.syncIndexes(),
    Namespace.syncIndexes(),
    PasswordReset.syncIndexes(),
    Queue.syncIndexes(),
    QueueMember.syncIndexes(),
    RefreshToken.syncIndexes(),
    Storefront.syncIndexes(),
    User.syncIndexes(),
    WebSocket.syncIndexes(),
    Workflow.syncIndexes(),
  ]);
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    Article.deleteMany(),
    Authorization.deleteMany(),
    AuthorizationRequest.deleteMany(),
    Build.deleteMany(),
    Collection.deleteMany(),
    Friend.deleteMany(),
    GameServer.deleteMany(),
    Group.deleteMany(),
    GroupInvitation.deleteMany(),
    Ignoration.deleteMany(),
    Login.deleteMany(),
    Message.deleteMany(),
    Namespace.deleteMany(),
    PasswordReset.deleteMany(),
    Queue.deleteMany(),
    QueueMember.deleteMany(),
    RefreshToken.deleteMany(),
    Storefront.deleteMany(),
    User.deleteMany(),
    WebSocket.deleteMany(),
    Workflow.deleteMany(),
  ]);
});
