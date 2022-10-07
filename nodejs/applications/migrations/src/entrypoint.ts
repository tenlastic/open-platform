import 'source-map-support/register';

import {
  Authorization,
  Friend,
  Group,
  GroupInvitation,
  Ignoration,
  Login,
  Message,
  Namespace,
  PasswordReset,
  RefreshToken,
  User,
  WebSocket,
} from '@tenlastic/api';
import '@tenlastic/logging';
import * as migrations from '@tenlastic/mongoose-migrations';
import * as mongoose from '@tenlastic/mongoose-models';

import { compatibilityVersion60 } from './migrations';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;

(async () => {
  try {
    await mongoose.connect({ connectionString: mongoConnectionString, databaseName: 'api' });

    console.log('Syncing indexes...');
    await Promise.all([
      Authorization.syncIndexes({ background: true }),
      Friend.syncIndexes({ background: true }),
      Group.syncIndexes({ background: true }),
      GroupInvitation.syncIndexes({ background: true }),
      Ignoration.syncIndexes({ background: true }),
      Login.syncIndexes({ background: true }),
      Message.syncIndexes({ background: true }),
      Namespace.syncIndexes({ background: true }),
      PasswordReset.syncIndexes({ background: true }),
      RefreshToken.syncIndexes({ background: true }),
      User.syncIndexes({ background: true }),
      WebSocket.syncIndexes({ background: true }),
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
