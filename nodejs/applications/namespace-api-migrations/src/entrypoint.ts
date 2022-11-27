import 'source-map-support/register';

import * as mongoose from '@tenlastic/mongoose';
import {
  Article,
  Authorization,
  Build,
  Collection,
  GameServer,
  Group,
  Namespace,
  Queue,
  QueueMember,
  Schema,
  Storefront,
  User,
  WebSocket,
  Workflow,
} from '@tenlastic/namespace-api';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME;

(async () => {
  try {
    const connection = await mongoose.connect({
      connectionString: mongoConnectionString,
      databaseName: mongoDatabaseName,
    });

    console.log('Syncing indexes...');
    await Promise.all([
      mongoose.syncIndexes(Article),
      mongoose.syncIndexes(Authorization),
      mongoose.syncIndexes(Build),
      mongoose.syncIndexes(Collection),
      mongoose.syncIndexes(GameServer),
      mongoose.syncIndexes(Group),
      mongoose.syncIndexes(Namespace),
      mongoose.syncIndexes(Queue),
      mongoose.syncIndexes(QueueMember),
      mongoose.syncIndexes(Schema),
      mongoose.syncIndexes(Storefront),
      mongoose.syncIndexes(User),
      mongoose.syncIndexes(WebSocket),
      mongoose.syncIndexes(Workflow),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Syncing schemas...');
    await Promise.all([
      Schema.sync(Article),
      Schema.sync(Authorization),
      Schema.sync(Build),
      Schema.sync(Collection),
      Schema.sync(GameServer),
      Schema.sync(Group),
      Schema.sync(Namespace),
      Schema.sync(Queue),
      Schema.sync(QueueMember),
      Schema.sync(Storefront),
      Schema.sync(User),
      Schema.sync(WebSocket),
      Schema.sync(Workflow),
    ]);
    console.log('Schemas synced successfully!');

    console.log('Setting feature compatibility version to 6.0...');
    await connection.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
    console.log('Feature compatibility version successfully set to 6.0!');

    console.log('Enabling Document Pre- and Post-Images...');
    await Promise.all([
      mongoose.enablePrePostImages(Article),
      mongoose.enablePrePostImages(Authorization),
      mongoose.enablePrePostImages(Build),
      mongoose.enablePrePostImages(Collection),
      mongoose.enablePrePostImages(GameServer),
      mongoose.enablePrePostImages(Group),
      mongoose.enablePrePostImages(Namespace),
      mongoose.enablePrePostImages(Queue),
      mongoose.enablePrePostImages(QueueMember),
      mongoose.enablePrePostImages(Storefront),
      mongoose.enablePrePostImages(User),
      mongoose.enablePrePostImages(WebSocket),
      mongoose.enablePrePostImages(Workflow),
    ]);
    console.log('Document Pre- and Post-Images enabled successfully!');

    process.exit();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
