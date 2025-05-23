import {
  AuthorizationModel,
  connect,
  enablePrePostImages,
  GroupModel,
  GroupInvitationModel,
  MatchInvitationModel,
  MatchModel,
  NamespaceModel,
  QueueMemberModel,
  SchemaSchema,
  StorefrontModel,
  syncIndexes,
  UserModel,
  WebSocketModel,
} from '@tenlastic/mongoose';
import { getModelForClass } from '@typegoose/typegoose';

export async function mongo(connectionString: string, databaseName: string) {
  const connection = await connect({ connectionString, databaseName });
  const SchemaModel = getModelForClass(SchemaSchema);

  console.log('Syncing indexes...');
  await Promise.all([
    syncIndexes(AuthorizationModel),
    syncIndexes(GroupModel),
    syncIndexes(GroupInvitationModel),
    syncIndexes(MatchInvitationModel),
    syncIndexes(MatchModel),
    syncIndexes(NamespaceModel),
    syncIndexes(QueueMemberModel),
    syncIndexes(SchemaModel),
    syncIndexes(StorefrontModel),
    syncIndexes(UserModel),
    syncIndexes(WebSocketModel),
  ]);
  console.log('Indexes synced successfully!');

  console.log('Syncing schemas...');
  await Promise.all([
    SchemaModel.sync(AuthorizationModel),
    SchemaModel.sync(GroupModel),
    SchemaModel.sync(GroupInvitationModel),
    SchemaModel.sync(MatchInvitationModel),
    SchemaModel.sync(MatchModel),
    SchemaModel.sync(NamespaceModel),
    SchemaModel.sync(QueueMemberModel),
    SchemaModel.sync(StorefrontModel),
    SchemaModel.sync(UserModel),
    SchemaModel.sync(WebSocketModel),
  ]);
  console.log('Schemas synced successfully!');

  console.log('Setting feature compatibility version to 6.0...');
  await connection.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
  console.log('Feature compatibility version successfully set to 6.0!');

  console.log('Enabling Document Pre- and Post-Images...');
  await Promise.all([
    enablePrePostImages(AuthorizationModel),
    enablePrePostImages(GroupModel),
    enablePrePostImages(GroupInvitationModel),
    enablePrePostImages(MatchInvitationModel),
    enablePrePostImages(MatchModel),
    enablePrePostImages(NamespaceModel),
    enablePrePostImages(QueueMemberModel),
    enablePrePostImages(StorefrontModel),
    enablePrePostImages(UserModel),
    enablePrePostImages(WebSocketModel),
  ]);
  console.log('Document Pre- and Post-Images enabled successfully!');
}
