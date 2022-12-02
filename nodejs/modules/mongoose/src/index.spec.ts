import { connect } from './connect';
import {
  ArticleModel,
  AuthorizationModel,
  AuthorizationRequestModel,
  BuildModel,
  CollectionModel,
  FriendModel,
  GameServerModel,
  GroupModel,
  GroupInvitationModel,
  IgnorationModel,
  LoginModel,
  MessageModel,
  NamespaceModel,
  PasswordResetModel,
  QueueModel,
  QueueMemberModel,
  RefreshTokenModel,
  StorefrontModel,
  UserModel,
  WebSocketModel,
  WorkflowModel,
} from './models';

before(async function () {
  await connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'mongoose',
  });
  await Promise.all([
    ArticleModel.syncIndexes(),
    AuthorizationModel.syncIndexes(),
    AuthorizationRequestModel.syncIndexes(),
    BuildModel.syncIndexes(),
    CollectionModel.syncIndexes(),
    FriendModel.syncIndexes(),
    GameServerModel.syncIndexes(),
    GroupModel.syncIndexes(),
    GroupInvitationModel.syncIndexes(),
    IgnorationModel.syncIndexes(),
    LoginModel.syncIndexes(),
    MessageModel.syncIndexes(),
    NamespaceModel.syncIndexes(),
    PasswordResetModel.syncIndexes(),
    QueueModel.syncIndexes(),
    QueueMemberModel.syncIndexes(),
    RefreshTokenModel.syncIndexes(),
    StorefrontModel.syncIndexes(),
    UserModel.syncIndexes(),
    WebSocketModel.syncIndexes(),
    WorkflowModel.syncIndexes(),
  ]);
});

beforeEach(async function () {
  // MongoDB.
  await Promise.all([
    ArticleModel.deleteMany(),
    AuthorizationModel.deleteMany(),
    AuthorizationRequestModel.deleteMany(),
    BuildModel.deleteMany(),
    CollectionModel.deleteMany(),
    FriendModel.deleteMany(),
    GameServerModel.deleteMany(),
    GroupModel.deleteMany(),
    GroupInvitationModel.deleteMany(),
    IgnorationModel.deleteMany(),
    LoginModel.deleteMany(),
    MessageModel.deleteMany(),
    NamespaceModel.deleteMany(),
    PasswordResetModel.deleteMany(),
    QueueModel.deleteMany(),
    QueueMemberModel.deleteMany(),
    RefreshTokenModel.deleteMany(),
    StorefrontModel.deleteMany(),
    UserModel.deleteMany(),
    WebSocketModel.deleteMany(),
    WorkflowModel.deleteMany(),
  ]);
});
