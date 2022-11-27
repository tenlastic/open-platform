import 'source-map-support/register';

import {
  Article,
  Authorization,
  Build,
  Collection,
  connect,
  enablePrePostImages,
  GameServer,
  Group,
  Namespace,
  Queue,
  QueueMember,
  SchemaSchema,
  Storefront,
  syncIndexes,
  User,
  WebSocket,
  Workflow,
} from '@tenlastic/mongoose';
import { getModelForClass } from '@typegoose/typegoose';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME;
const Schema = getModelForClass(SchemaSchema);

(async () => {
  try {
    const connection = await connect({
      connectionString: mongoConnectionString,
      databaseName: mongoDatabaseName,
    });

    console.log('Syncing indexes...');
    await Promise.all([
      syncIndexes(Article),
      syncIndexes(Authorization),
      syncIndexes(Build),
      syncIndexes(Collection),
      syncIndexes(GameServer),
      syncIndexes(Group),
      syncIndexes(Namespace),
      syncIndexes(Queue),
      syncIndexes(QueueMember),
      syncIndexes(Schema),
      syncIndexes(Storefront),
      syncIndexes(User),
      syncIndexes(WebSocket),
      syncIndexes(Workflow),
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
      enablePrePostImages(Article),
      enablePrePostImages(Authorization),
      enablePrePostImages(Build),
      enablePrePostImages(Collection),
      enablePrePostImages(GameServer),
      enablePrePostImages(Group),
      enablePrePostImages(Namespace),
      enablePrePostImages(Queue),
      enablePrePostImages(QueueMember),
      enablePrePostImages(Storefront),
      enablePrePostImages(User),
      enablePrePostImages(WebSocket),
      enablePrePostImages(Workflow),
    ]);
    console.log('Document Pre- and Post-Images enabled successfully!');

    process.exit();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
