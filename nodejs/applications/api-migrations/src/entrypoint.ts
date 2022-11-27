import 'source-map-support/register';

import {
  Authorization,
  AuthorizationRequest,
  Login,
  Namespace,
  PasswordReset,
  RefreshToken,
  Schema,
  User,
  WebSocket,
} from '@tenlastic/api';
import * as mongoose from '@tenlastic/mongoose';

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
      mongoose.syncIndexes(Login),
      mongoose.syncIndexes(Namespace),
      mongoose.syncIndexes(PasswordReset),
      mongoose.syncIndexes(RefreshToken),
      mongoose.syncIndexes(Schema),
      mongoose.syncIndexes(User),
      mongoose.syncIndexes(WebSocket),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Syncing schemas...');
    await Promise.all([
      Schema.sync(Authorization),
      Schema.sync(AuthorizationRequest),
      Schema.sync(Login),
      Schema.sync(Namespace),
      Schema.sync(PasswordReset),
      Schema.sync(RefreshToken),
      Schema.sync(User),
      Schema.sync(WebSocket),
    ]);
    console.log('Schemas synced successfully!');

    console.log('Setting feature compatibility version to 6.0...');
    await connection.db.admin().command({ setFeatureCompatibilityVersion: '6.0' });
    console.log('Feature compatibility version successfully set to 6.0!');

    console.log('Enabling Document Pre- and Post-Images...');
    await Promise.all([
      mongoose.enablePrePostImages(Authorization),
      mongoose.enablePrePostImages(AuthorizationRequest),
      mongoose.enablePrePostImages(Login),
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
