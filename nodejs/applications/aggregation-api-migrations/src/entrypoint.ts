import 'source-map-support/register';

import {
  AuthorizationModel,
  connect,
  enablePrePostImages,
  FriendModel,
  GameServerModel,
  GroupModel,
  GroupInvitationModel,
  IgnorationModel,
  MessageModel,
  NamespaceModel,
  QueueMemberModel,
  SchemaSchema,
  StorefrontModel,
  syncIndexes,
  UserModel,
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
      syncIndexes(GameServerModel),
      syncIndexes(GroupModel),
      syncIndexes(GroupInvitationModel),
      syncIndexes(IgnorationModel),
      syncIndexes(MessageModel),
      syncIndexes(NamespaceModel),
      syncIndexes(QueueMemberModel),
      syncIndexes(SchemaModel),
      syncIndexes(StorefrontModel),
      syncIndexes(UserModel),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Syncing schemas...');
    await Promise.all([
      SchemaModel.sync(AuthorizationModel),
      SchemaModel.sync(FriendModel),
      SchemaModel.sync(GameServerModel),
      SchemaModel.sync(GroupModel),
      SchemaModel.sync(GroupInvitationModel),
      SchemaModel.sync(IgnorationModel),
      SchemaModel.sync(MessageModel),
      SchemaModel.sync(NamespaceModel),
      SchemaModel.sync(QueueMemberModel),
      SchemaModel.sync(StorefrontModel),
      SchemaModel.sync(UserModel),
    ]);
    console.log('Schemas synced successfully!');

    console.log('Setting feature compatibility version to 6.0...');
    await connection.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
    console.log('Feature compatibility version successfully set to 6.0!');

    console.log('Enabling Document Pre- and Post-Images...');
    await Promise.all([
      enablePrePostImages(AuthorizationModel),
      enablePrePostImages(FriendModel),
      enablePrePostImages(GameServerModel),
      enablePrePostImages(GroupModel),
      enablePrePostImages(GroupInvitationModel),
      enablePrePostImages(IgnorationModel),
      enablePrePostImages(MessageModel),
      enablePrePostImages(NamespaceModel),
      enablePrePostImages(QueueMemberModel),
      enablePrePostImages(StorefrontModel),
      enablePrePostImages(UserModel),
    ]);
    console.log('Document Pre- and Post-Images enabled successfully!');

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
