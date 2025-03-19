import { connect } from './connect';
import {
  ArticleModel,
  AuthorizationModel,
  AuthorizationRequestModel,
  BuildModel,
  CollectionModel,
  GameServerModel,
  GameServerTemplateModel,
  GroupModel,
  GroupInvitationModel,
  LoginModel,
  NamespaceModel,
  PasswordResetModel,
  QueueModel,
  QueueMemberModel,
  RefreshTokenModel,
  SteamIntegrationModel,
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
    GameServerModel.syncIndexes(),
    GameServerTemplateModel.syncIndexes(),
    GroupModel.syncIndexes(),
    GroupInvitationModel.syncIndexes(),
    LoginModel.syncIndexes(),
    NamespaceModel.syncIndexes(),
    PasswordResetModel.syncIndexes(),
    QueueModel.syncIndexes(),
    QueueMemberModel.syncIndexes(),
    RefreshTokenModel.syncIndexes(),
    SteamIntegrationModel.syncIndexes(),
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
    GameServerModel.deleteMany(),
    GameServerTemplateModel.deleteMany(),
    GroupModel.deleteMany(),
    GroupInvitationModel.deleteMany(),
    LoginModel.deleteMany(),
    NamespaceModel.deleteMany(),
    PasswordResetModel.deleteMany(),
    QueueModel.deleteMany(),
    QueueMemberModel.deleteMany(),
    RefreshTokenModel.deleteMany(),
    SteamIntegrationModel.deleteMany(),
    StorefrontModel.deleteMany(),
    UserModel.deleteMany(),
    WebSocketModel.deleteMany(),
    WorkflowModel.deleteMany(),
  ]);
});
