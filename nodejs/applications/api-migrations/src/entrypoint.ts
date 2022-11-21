import 'source-map-support/register';

import {
  Authorization,
  AuthorizationRequest,
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
      mongoose.syncIndexes(Authorization),
      mongoose.syncIndexes(AuthorizationRequest),
      mongoose.syncIndexes(Friend),
      mongoose.syncIndexes(Group),
      mongoose.syncIndexes(GroupInvitation),
      mongoose.syncIndexes(Ignoration),
      mongoose.syncIndexes(Login),
      mongoose.syncIndexes(Message),
      mongoose.syncIndexes(Namespace),
      mongoose.syncIndexes(PasswordReset),
      mongoose.syncIndexes(RefreshToken),
      mongoose.syncIndexes(mongoose.Schema),
      mongoose.syncIndexes(User),
      mongoose.syncIndexes(WebSocket),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Syncing schemas...');
    await Promise.all([
      mongoose.syncSchema(connection, Authorization),
      mongoose.syncSchema(connection, AuthorizationRequest),
      mongoose.syncSchema(connection, Friend),
      mongoose.syncSchema(connection, Group),
      mongoose.syncSchema(connection, GroupInvitation),
      mongoose.syncSchema(connection, Ignoration),
      mongoose.syncSchema(connection, Login),
      mongoose.syncSchema(connection, Message),
      mongoose.syncSchema(connection, Namespace),
      mongoose.syncSchema(connection, PasswordReset),
      mongoose.syncSchema(connection, RefreshToken),
      mongoose.syncSchema(connection, User),
      mongoose.syncSchema(connection, WebSocket),
    ]);
    console.log('Schemas synced successfully!');

    console.log('Setting feature compatibility version to 6.0...');
    await connection.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
    console.log('Feature compatibility version successfully set to 6.0!');

    console.log('Enabling Document Pre- and Post-Images...');
    await Promise.all([
      mongoose.enablePrePostImages(Authorization),
      mongoose.enablePrePostImages(AuthorizationRequest),
      mongoose.enablePrePostImages(Friend),
      mongoose.enablePrePostImages(Group),
      mongoose.enablePrePostImages(GroupInvitation),
      mongoose.enablePrePostImages(Ignoration),
      mongoose.enablePrePostImages(Login),
      mongoose.enablePrePostImages(Message),
      mongoose.enablePrePostImages(Namespace),
      mongoose.enablePrePostImages(PasswordReset),
      mongoose.enablePrePostImages(RefreshToken),
      mongoose.enablePrePostImages(User),
      mongoose.enablePrePostImages(WebSocket),
    ]);
    console.log('Document Pre- and Post-Images enabled successfully!');

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
