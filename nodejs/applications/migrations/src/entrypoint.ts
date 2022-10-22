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
import * as mongoose from '@tenlastic/mongoose-models';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;

(async () => {
  try {
    const connection = await mongoose.connect({
      connectionString: mongoConnectionString,
      databaseName: 'api',
    });

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

    console.log('Enabling Document Pre- and Post-Images...');
    const options = { changeStreamPreAndPostImages: { enabled: true } };
    await Promise.all([
      Authorization.db.db.command({ collMod: Authorization.collection.name, ...options }),
      Friend.db.db.command({ collMod: Friend.collection.name, ...options }),
      Group.db.db.command({ collMod: Group.collection.name, ...options }),
      GroupInvitation.db.db.command({ collMod: GroupInvitation.collection.name, ...options }),
      Ignoration.db.db.command({ collMod: Ignoration.collection.name, ...options }),
      Login.db.db.command({ collMod: Login.collection.name, ...options }),
      Message.db.db.command({ collMod: Message.collection.name, ...options }),
      Namespace.db.db.command({ collMod: Namespace.collection.name, ...options }),
      PasswordReset.db.db.command({ collMod: PasswordReset.collection.name, ...options }),
      RefreshToken.db.db.command({ collMod: RefreshToken.collection.name, ...options }),
      User.db.db.command({ collMod: User.collection.name, ...options }),
      WebSocket.db.db.command({ collMod: WebSocket.collection.name, ...options }),
    ]);
    console.log('Document Pre- and Post-Images enabled successfully!');

    console.log('Setting feature compatibility version to 6.0...');
    await connection.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
    console.log('Feature compatibility version successfully set to 6.0!');

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
