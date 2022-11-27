import 'source-map-support/register';

import {
  Authorization,
  AuthorizationRequest,
  connect,
  enablePrePostImages,
  Login,
  Namespace,
  PasswordReset,
  RefreshToken,
  SchemaSchema,
  syncIndexes,
  User,
  WebSocket,
} from '@tenlastic/mongoose';
import { getModelForClass } from '@typegoose/typegoose';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const Schema = getModelForClass(SchemaSchema);

(async () => {
  try {
    const connection = await connect({
      connectionString: mongoConnectionString,
      databaseName: 'api',
    });

    console.log('Syncing indexes...');
    await Promise.all([
      syncIndexes(Authorization),
      syncIndexes(AuthorizationRequest),
      syncIndexes(Login),
      syncIndexes(Namespace),
      syncIndexes(PasswordReset),
      syncIndexes(RefreshToken),
      syncIndexes(Schema),
      syncIndexes(User),
      syncIndexes(WebSocket),
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
      enablePrePostImages(Authorization),
      enablePrePostImages(AuthorizationRequest),
      enablePrePostImages(Login),
      enablePrePostImages(Namespace),
      enablePrePostImages(PasswordReset),
      enablePrePostImages(RefreshToken),
      enablePrePostImages(User),
      enablePrePostImages(WebSocket),
    ]);
    console.log('Document Pre- and Post-Images enabled successfully!');

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
