import 'source-map-support/register';

import {
  connect,
  enablePrePostImages,
  Friend,
  Group,
  GroupInvitation,
  Ignoration,
  Message,
  SchemaSchema,
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
      databaseName: 'social-api',
    });

    console.log('Syncing indexes...');
    await Promise.all([
      syncIndexes(Friend),
      syncIndexes(Group),
      syncIndexes(GroupInvitation),
      syncIndexes(Ignoration),
      syncIndexes(Message),
      syncIndexes(Schema),
      syncIndexes(User),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Syncing schemas...');
    await Promise.all([
      Schema.sync(Friend),
      Schema.sync(Group),
      Schema.sync(GroupInvitation),
      Schema.sync(Ignoration),
      Schema.sync(Message),
      Schema.sync(User),
    ]);
    console.log('Schemas synced successfully!');

    console.log('Setting feature compatibility version to 6.0...');
    await connection.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
    console.log('Feature compatibility version successfully set to 6.0!');

    console.log('Enabling Document Pre- and Post-Images...');
    await Promise.all([
      enablePrePostImages(Friend),
      enablePrePostImages(Group),
      enablePrePostImages(GroupInvitation),
      enablePrePostImages(Ignoration),
      enablePrePostImages(Message),
      enablePrePostImages(User),
    ]);
    console.log('Document Pre- and Post-Images enabled successfully!');

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
