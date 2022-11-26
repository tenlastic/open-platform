import 'source-map-support/register';

import {
  Authorization,
  Friend,
  Group,
  GroupInvitation,
  Ignoration,
  Message,
  User,
} from '@tenlastic/social-api';
import * as mongoose from '@tenlastic/mongoose-models';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;

(async () => {
  try {
    const connection = await mongoose.connect({
      connectionString: mongoConnectionString,
      databaseName: 'social-api',
    });

    console.log('Syncing indexes...');
    await Promise.all([
      mongoose.syncIndexes(Authorization),
      mongoose.syncIndexes(Friend),
      mongoose.syncIndexes(Group),
      mongoose.syncIndexes(GroupInvitation),
      mongoose.syncIndexes(Ignoration),
      mongoose.syncIndexes(Message),
      mongoose.syncIndexes(mongoose.Schema),
      mongoose.syncIndexes(User),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Syncing schemas...');
    await Promise.all([
      mongoose.syncSchema(connection, Authorization),
      mongoose.syncSchema(connection, Friend),
      mongoose.syncSchema(connection, Group),
      mongoose.syncSchema(connection, GroupInvitation),
      mongoose.syncSchema(connection, Ignoration),
      mongoose.syncSchema(connection, Message),
      mongoose.syncSchema(connection, User),
    ]);
    console.log('Schemas synced successfully!');

    console.log('Setting feature compatibility version to 6.0...');
    await connection.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
    console.log('Feature compatibility version successfully set to 6.0!');

    console.log('Enabling Document Pre- and Post-Images...');
    await Promise.all([
      mongoose.enablePrePostImages(Authorization),
      mongoose.enablePrePostImages(Friend),
      mongoose.enablePrePostImages(Group),
      mongoose.enablePrePostImages(GroupInvitation),
      mongoose.enablePrePostImages(Ignoration),
      mongoose.enablePrePostImages(Message),
      mongoose.enablePrePostImages(User),
    ]);
    console.log('Document Pre- and Post-Images enabled successfully!');

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
