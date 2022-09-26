import 'source-map-support/register';

import {
  Article,
  Authorization,
  Build,
  Collection,
  Friend,
  GameServer,
  Group,
  GroupInvitation,
  Ignoration,
  Login,
  Message,
  Namespace,
  PasswordReset,
  Queue,
  QueueMember,
  RefreshToken,
  Storefront,
  User,
  WebSocket,
  Workflow,
} from '@tenlastic/api';
import '@tenlastic/logging';
import * as migrations from '@tenlastic/mongoose-migrations';
import * as mongoose from '@tenlastic/mongoose-models';

import { compatibilityVersion60 } from './migrations';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME || 'api';

(async () => {
  try {
    await mongoose.connect({
      connectionString: mongoConnectionString,
      databaseName: mongoDatabaseName,
    });

    console.log('Syncing indexes...');
    await Promise.all([
      Article.syncIndexes({ background: true }),
      Authorization.syncIndexes({ background: true }),
      Build.syncIndexes({ background: true }),
      Collection.syncIndexes({ background: true }),
      Friend.syncIndexes({ background: true }),
      GameServer.syncIndexes({ background: true }),
      Group.syncIndexes({ background: true }),
      GroupInvitation.syncIndexes({ background: true }),
      Ignoration.syncIndexes({ background: true }),
      Login.syncIndexes({ background: true }),
      Message.syncIndexes({ background: true }),
      Namespace.syncIndexes({ background: true }),
      PasswordReset.syncIndexes({ background: true }),
      Queue.syncIndexes({ background: true }),
      QueueMember.syncIndexes({ background: true }),
      RefreshToken.syncIndexes({ background: true }),
      Storefront.syncIndexes({ background: true }),
      User.syncIndexes({ background: true }),
      WebSocket.syncIndexes({ background: true }),
      Workflow.syncIndexes({ background: true }),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Running migrations...');
    await migrations.up(compatibilityVersion60);
    console.log('Migrations finished successfully!');

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
