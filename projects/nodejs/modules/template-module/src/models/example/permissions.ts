import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Example, ExampleDocument, ExampleModel } from './model';

export const ExamplePermissions = new MongoosePermissions<ExampleDocument>(Example, {
  create: {},
  delete: {},
  find: {},
  read: {
    base: ['_id', 'createdAt', 'updatedAt'],
  },
  roles: [],
  update: {},
});
