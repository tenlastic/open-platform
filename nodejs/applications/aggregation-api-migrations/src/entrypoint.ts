import 'source-map-support/register';

import {
  Authorization,
  Group,
  Namespace,
  QueueMember,
  Storefront,
  User,
} from '@tenlastic/aggregation-api';
import '@tenlastic/logging';
import * as mongoose from '@tenlastic/mongoose-models';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;

(async () => {
  try {
    const connection = await mongoose.connect({
      connectionString: mongoConnectionString,
      databaseName: 'aggregation-api',
    });

    console.log('Syncing indexes...');
    await Promise.all([
      Authorization.syncIndexes({ background: true }),
      Group.syncIndexes({ background: true }),
      Namespace.syncIndexes({ background: true }),
      QueueMember.syncIndexes({ background: true }),
      Storefront.syncIndexes({ background: true }),
      User.syncIndexes({ background: true }),
    ]);
    console.log('Indexes synced successfully!');

    console.log('Enabling Document Pre- and Post-Images...');
    const options = { changeStreamPreAndPostImages: { enabled: true } };
    await Promise.all([
      Authorization.db.db.command({ collMod: Authorization.collection.name, ...options }),
      Group.db.db.command({ collMod: Group.collection.name, ...options }),
      Namespace.db.db.command({ collMod: Namespace.collection.name, ...options }),
      QueueMember.db.db.command({ collMod: QueueMember.collection.name, ...options }),
      Storefront.db.db.command({ collMod: Storefront.collection.name, ...options }),
      User.db.db.command({ collMod: User.collection.name, ...options }),
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
