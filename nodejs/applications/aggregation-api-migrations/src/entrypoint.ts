import 'source-map-support/register';

import {
  Authorization,
  GameServer,
  Group,
  Namespace,
  QueueMember,
  Storefront,
  User,
} from '@tenlastic/aggregation-api';
import * as mongoose from '@tenlastic/mongoose-models';

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
      mongoose.syncIndexes(mongoose.Schema),
      mongoose.syncIndexes(Storefront),
      mongoose.syncIndexes(User),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Syncing schemas...');
    await Promise.all([
      mongoose.syncSchema(connection, Authorization),
      mongoose.syncSchema(connection, GameServer),
      mongoose.syncSchema(connection, Group),
      mongoose.syncSchema(connection, Namespace),
      mongoose.syncSchema(connection, QueueMember),
      mongoose.syncSchema(connection, Storefront),
      mongoose.syncSchema(connection, User),
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
