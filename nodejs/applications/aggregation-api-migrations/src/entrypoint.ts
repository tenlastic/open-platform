import 'source-map-support/register';

import {
  AuthorizationModel,
  connect,
  enablePrePostImages,
  FriendModel,
  GroupModel,
  GroupInvitationModel,
  IgnorationModel,
  MatchInvitationModel,
  MatchModel,
  MessageModel,
  NamespaceModel,
  QueueMemberModel,
  SchemaSchema,
  StorefrontModel,
  syncIndexes,
  UserModel,
  WebSocketModel,
} from '@tenlastic/mongoose';
import { getModelForClass } from '@typegoose/typegoose';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const SchemaModel = getModelForClass(SchemaSchema);

(async () => {
  try {
    const connection = await connect({
      connectionString: mongoConnectionString,
      databaseName: 'aggregation-api',
    });

    console.log('Syncing indexes...');
    await Promise.all([
      syncIndexes(AuthorizationModel),
      syncIndexes(FriendModel),
      syncIndexes(GroupModel),
      syncIndexes(GroupInvitationModel),
      syncIndexes(IgnorationModel),
      syncIndexes(MatchInvitationModel),
      syncIndexes(MatchModel),
      syncIndexes(MessageModel),
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
      SchemaModel.sync(FriendModel),
      SchemaModel.sync(GroupModel),
      SchemaModel.sync(GroupInvitationModel),
      SchemaModel.sync(IgnorationModel),
      SchemaModel.sync(MatchInvitationModel),
      SchemaModel.sync(MatchModel),
      SchemaModel.sync(MessageModel),
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
      enablePrePostImages(FriendModel),
      enablePrePostImages(GroupModel),
      enablePrePostImages(GroupInvitationModel),
      enablePrePostImages(IgnorationModel),
      enablePrePostImages(MatchInvitationModel),
      enablePrePostImages(MatchModel),
      enablePrePostImages(MessageModel),
      enablePrePostImages(NamespaceModel),
      enablePrePostImages(QueueMemberModel),
      enablePrePostImages(StorefrontModel),
      enablePrePostImages(UserModel),
      enablePrePostImages(WebSocketModel),
    ]);
    console.log('Document Pre- and Post-Images enabled successfully!');

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
