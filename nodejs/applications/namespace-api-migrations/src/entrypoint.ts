import { connect } from '@tenlastic/mongoose-models';
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
    const connection = await connect({
      connectionString: mongoConnectionString,
      databaseName: mongoDatabaseName,
    });

    console.log('Syncing indexes...');
    await Promise.all([
      Article.syncIndexes({ background: true }),
      Authorization.syncIndexes({ background: true }),
      Build.syncIndexes({ background: true }),
      Collection.syncIndexes({ background: true }),
      GameServer.syncIndexes({ background: true }),
      Group.syncIndexes({ background: true }),
      Namespace.syncIndexes({ background: true }),
      Queue.syncIndexes({ background: true }),
      QueueMember.syncIndexes({ background: true }),
      Storefront.syncIndexes({ background: true }),
      User.syncIndexes({ background: true }),
      WebSocket.syncIndexes({ background: true }),
      Workflow.syncIndexes({ background: true }),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Enabling Document Pre- and Post-Images...');
    const options = { changeStreamPreAndPostImages: { enabled: true } };
    await Promise.all([
      Article.db.db.command({ collMod: Article.collection.name, ...options }),
      Authorization.db.db.command({ collMod: Authorization.collection.name, ...options }),
      Build.db.db.command({ collMod: Build.collection.name, ...options }),
      Collection.db.db.command({ collMod: Collection.collection.name, ...options }),
      GameServer.db.db.command({ collMod: GameServer.collection.name, ...options }),
      Group.db.db.command({ collMod: Group.collection.name, ...options }),
      Namespace.db.db.command({ collMod: Namespace.collection.name, ...options }),
      Queue.db.db.command({ collMod: Queue.collection.name, ...options }),
      QueueMember.db.db.command({ collMod: QueueMember.collection.name, ...options }),
      Storefront.db.db.command({ collMod: Storefront.collection.name, ...options }),
      User.db.db.command({ collMod: User.collection.name, ...options }),
      WebSocket.db.db.command({ collMod: WebSocket.collection.name, ...options }),
      Workflow.db.db.command({ collMod: Workflow.collection.name, ...options }),
    ]);
    console.log('Document Pre- and Post-Images enabled successfully!');

    console.log('Setting feature compatibility version to 6.0...');
    await connection.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
    console.log('Feature compatibility version successfully set to 6.0!');
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
