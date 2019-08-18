import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Example, ExampleDocument } from './model';

export const ExamplePermissions = new MongoosePermissions<ExampleDocument>(Example, {
  create: {},
  delete: {},
  find: {
    base: {},
  },
  read: {
    base: ['_id', 'createdAt', 'updatedAt'],
  },
  roles: [],
  update: {},
});
