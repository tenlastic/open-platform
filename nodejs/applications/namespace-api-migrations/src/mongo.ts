import {
  ArticleModel,
  AuthorizationModel,
  BuildModel,
  CollectionModel,
  connect,
  enablePrePostImages,
  GameServerModel,
  GameServerTemplateModel,
  GroupInvitationModel,
  GroupModel,
  MatchInvitationModel,
  MatchModel,
  NamespaceModel,
  QueueModel,
  QueueMemberModel,
  SchemaSchema,
  StorefrontModel,
  syncIndexes,
  TeamModel,
  UserModel,
  WebSocketModel,
  WorkflowModel,
} from '@tenlastic/mongoose';
import { getModelForClass } from '@typegoose/typegoose';

export async function mongo(connectionString: string, databaseName: string) {
  const connection = await connect({ connectionString, databaseName });
  const SchemaModel = getModelForClass(SchemaSchema);

  console.log('Syncing indexes...');
  await Promise.all([
    syncIndexes(ArticleModel),
    syncIndexes(AuthorizationModel),
    syncIndexes(BuildModel),
    syncIndexes(CollectionModel),
    syncIndexes(GameServerModel),
    syncIndexes(GameServerTemplateModel),
    syncIndexes(GroupInvitationModel),
    syncIndexes(GroupModel),
    syncIndexes(MatchInvitationModel),
    syncIndexes(MatchModel),
    syncIndexes(NamespaceModel),
    syncIndexes(QueueModel),
    syncIndexes(QueueMemberModel),
    syncIndexes(SchemaModel),
    syncIndexes(StorefrontModel),
    syncIndexes(TeamModel),
    syncIndexes(UserModel),
    syncIndexes(WebSocketModel),
    syncIndexes(WorkflowModel),
  ]);
  console.log('Indexes synced successfully!');

  console.log('Syncing schemas...');
  await Promise.all([
    SchemaModel.sync(ArticleModel),
    SchemaModel.sync(AuthorizationModel),
    SchemaModel.sync(BuildModel),
    SchemaModel.sync(CollectionModel),
    SchemaModel.sync(GameServerModel),
    SchemaModel.sync(GameServerTemplateModel),
    SchemaModel.sync(GroupInvitationModel),
    SchemaModel.sync(GroupModel),
    SchemaModel.sync(MatchInvitationModel),
    SchemaModel.sync(MatchModel),
    SchemaModel.sync(NamespaceModel),
    SchemaModel.sync(QueueModel),
    SchemaModel.sync(QueueMemberModel),
    SchemaModel.sync(StorefrontModel),
    SchemaModel.sync(TeamModel),
    SchemaModel.sync(UserModel),
    SchemaModel.sync(WebSocketModel),
    SchemaModel.sync(WorkflowModel),
  ]);
  console.log('Schemas synced successfully!');

  console.log('Setting feature compatibility version to 6.0...');
  await connection.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
  console.log('Feature compatibility version successfully set to 6.0!');

  console.log('Enabling Document Pre- and Post-Images...');
  await Promise.all([
    enablePrePostImages(ArticleModel),
    enablePrePostImages(AuthorizationModel),
    enablePrePostImages(BuildModel),
    enablePrePostImages(CollectionModel),
    enablePrePostImages(GameServerModel),
    enablePrePostImages(GameServerTemplateModel),
    enablePrePostImages(GroupInvitationModel),
    enablePrePostImages(GroupModel),
    enablePrePostImages(MatchInvitationModel),
    enablePrePostImages(MatchModel),
    enablePrePostImages(NamespaceModel),
    enablePrePostImages(QueueModel),
    enablePrePostImages(QueueMemberModel),
    enablePrePostImages(StorefrontModel),
    enablePrePostImages(TeamModel),
    enablePrePostImages(UserModel),
    enablePrePostImages(WebSocketModel),
    enablePrePostImages(WorkflowModel),
  ]);
  console.log('Document Pre- and Post-Images enabled successfully!');
}
