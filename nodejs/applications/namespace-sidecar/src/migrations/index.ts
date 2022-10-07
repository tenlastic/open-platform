import { up } from '@tenlastic/mongoose-migrations';
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

import { migration as compatibilityVersion60 } from './compatibility-version-6-0';

export async function migrations() {
  try {
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

    console.log('Running migrations...');
    await up(compatibilityVersion60);
    console.log('Migrations finished successfully!');
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
