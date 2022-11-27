import 'source-map-support/register';

import {
  Authorization,
  GameServer,
  Group,
  Namespace,
  QueueMember,
  Schema,
  Storefront,
  User,
} from '@tenlastic/aggregation-api';
import * as mongoose from '@tenlastic/mongoose';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;

(async () => {
  try {
    const connection = await mongoose.connect({
      connectionString: mongoConnectionString,
      databaseName: 'aggregation-api',
    });

    console.log('Syncing indexes...');
    await Promise.all([
      mongoose.syncIndexes(Authorization),
      mongoose.syncIndexes(GameServer),
      mongoose.syncIndexes(Group),
      mongoose.syncIndexes(Namespace),
      mongoose.syncIndexes(QueueMember),
      mongoose.syncIndexes(Schema),
      mongoose.syncIndexes(Storefront),
      mongoose.syncIndexes(User),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Syncing schemas...');
    await Promise.all([
      Schema.sync(Authorization),
      Schema.sync(GameServer),
      Schema.sync(Group),
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
      mongoose.enablePrePostImages(Authorization),
      mongoose.enablePrePostImages(GameServer),
      mongoose.enablePrePostImages(Group),
      mongoose.enablePrePostImages(Namespace),
      mongoose.enablePrePostImages(QueueMember),
      mongoose.enablePrePostImages(Storefront),
      mongoose.enablePrePostImages(User),
    ]);
    console.log('Document Pre- and Post-Images enabled successfully!');

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
