import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Connection, ConnectionDocument } from './model';

export const ConnectionPermissions = new MongoosePermissions<ConnectionDocument>(Connection, {
  find: {
    base: {},
  },
  read: {
    base: ['_id', 'createdAt', 'gameId', 'updatedAt', 'userId'],
  },
});
