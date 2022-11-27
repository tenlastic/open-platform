import 'source-map-support/register';

import {
  Authorization,
  connect,
  enablePrePostImages,
  Friend,
  GameServer,
  Group,
  GroupInvitation,
  Ignoration,
  Message,
  Namespace,
  QueueMember,
  SchemaSchema,
  Storefront,
  syncIndexes,
  User,
} from '@tenlastic/mongoose';
import { getModelForClass } from '@typegoose/typegoose';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const Schema = getModelForClass(SchemaSchema);

(async () => {
  try {
    const connection = await connect({
      connectionString: mongoConnectionString,
      databaseName: 'aggregation-api',
    });

    console.log('Syncing indexes...');
    await Promise.all([
      syncIndexes(Authorization),
      syncIndexes(Friend),
      syncIndexes(GameServer),
      syncIndexes(Group),
      syncIndexes(GroupInvitation),
      syncIndexes(Ignoration),
      syncIndexes(Message),
      syncIndexes(Namespace),
      syncIndexes(QueueMember),
      syncIndexes(Schema),
      syncIndexes(Storefront),
      syncIndexes(User),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Syncing schemas...');
    await Promise.all([
      Schema.sync(Authorization),
      Schema.sync(Friend),
      Schema.sync(GameServer),
      Schema.sync(Group),
      Schema.sync(GroupInvitation),
      Schema.sync(Ignoration),
      Schema.sync(Message),
      Schema.sync(Namespace),
      Schema.sync(QueueMember),
      Schema.sync(Storefront),
      Schema.sync(User),
    ]);
    console.log('Schemas synced successfully!');

    console.log('Setting feature compatibility version to 6.0...');
    await connection.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
    console.log('Feature compatibility version successfully set to 6.0!');

    console.log('Enabling Document Pre- and Post-Images...');
    await Promise.all([
      enablePrePostImages(Authorization),
      enablePrePostImages(Friend),
      enablePrePostImages(GameServer),
      enablePrePostImages(Group),
      enablePrePostImages(GroupInvitation),
      enablePrePostImages(Ignoration),
      enablePrePostImages(Message),
      enablePrePostImages(Namespace),
      enablePrePostImages(QueueMember),
      enablePrePostImages(Storefront),
      enablePrePostImages(User),
    ]);
    console.log('Document Pre- and Post-Images enabled successfully!');

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
