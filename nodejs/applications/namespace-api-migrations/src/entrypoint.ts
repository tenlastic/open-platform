import 'source-map-support/register';

import * as mongoose from '@tenlastic/mongoose-models';
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
      mongoose.syncIndexes(mongoose.Schema),
      mongoose.syncIndexes(Storefront),
      mongoose.syncIndexes(User),
      mongoose.syncIndexes(WebSocket),
      mongoose.syncIndexes(Workflow),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Syncing schemas...');
    await Promise.all([
      mongoose.syncSchema(connection, Article),
      mongoose.syncSchema(connection, Authorization),
      mongoose.syncSchema(connection, Build),
      mongoose.syncSchema(connection, Collection),
      mongoose.syncSchema(connection, GameServer),
      mongoose.syncSchema(connection, Group),
      mongoose.syncSchema(connection, Namespace),
      mongoose.syncSchema(connection, Queue),
      mongoose.syncSchema(connection, QueueMember),
      mongoose.syncSchema(connection, Storefront),
      mongoose.syncSchema(connection, User),
      mongoose.syncSchema(connection, WebSocket),
      mongoose.syncSchema(connection, Workflow),
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
