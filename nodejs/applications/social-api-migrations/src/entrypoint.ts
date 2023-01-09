import 'source-map-support/register';
import '@tenlastic/logging';

import {
  connect,
  enablePrePostImages,
  FriendModel,
  GroupModel,
  GroupInvitationModel,
  IgnorationModel,
  MessageModel,
  SchemaSchema,
  syncIndexes,
  UserModel,
} from '@tenlastic/mongoose';
import { getModelForClass } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const SchemaModel = getModelForClass(SchemaSchema, { existingMongoose: mongoose });

(async () => {
  try {
    const connection = await connect({
      connectionString: mongoConnectionString,
      databaseName: 'social-api',
    });

    console.log('Syncing indexes...');
    await Promise.all([
      syncIndexes(FriendModel),
      syncIndexes(GroupModel),
      syncIndexes(GroupInvitationModel),
      syncIndexes(IgnorationModel),
      syncIndexes(MessageModel),
      syncIndexes(SchemaModel),
      syncIndexes(UserModel),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Syncing schemas...');
    await Promise.all([
      SchemaModel.sync(FriendModel),
      SchemaModel.sync(GroupModel),
      SchemaModel.sync(GroupInvitationModel),
      SchemaModel.sync(IgnorationModel),
      SchemaModel.sync(MessageModel),
      SchemaModel.sync(UserModel),
    ]);
    console.log('Schemas synced successfully!');

    console.log('Setting feature compatibility version to 6.0...');
    await connection.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
    console.log('Feature compatibility version successfully set to 6.0!');

    console.log('Enabling Document Pre- and Post-Images...');
    await Promise.all([
      enablePrePostImages(FriendModel),
      enablePrePostImages(GroupModel),
      enablePrePostImages(GroupInvitationModel),
      enablePrePostImages(IgnorationModel),
      enablePrePostImages(MessageModel),
      enablePrePostImages(UserModel),
    ]);
    console.log('Document Pre- and Post-Images enabled successfully!');

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
