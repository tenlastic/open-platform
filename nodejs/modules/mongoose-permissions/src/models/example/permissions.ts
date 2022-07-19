import { MongoosePermissions } from '../../mongoose-permissions';
import { Example, ExampleDocument } from './model';

export const ExamplePermissions = new MongoosePermissions<ExampleDocument>(Example, {
  create: {
    admin: ['properties.age', 'name', 'urls'],
  },
  delete: {
    admin: true,
  },
  find: {
    admin: {},
  },
  populate: [{ path: 'parent' }],
  read: {
    admin: [
      '_id',
      'createdAt',
      'jsonSchema.*',
      'properties.age',
      'properties.name',
      'name',
      'updatedAt',
      'urls',
    ],
    default: ['_id', 'createdAt', 'updatedAt'],
  },
  roles: [
    {
      name: 'admin',
      query: { 'user.roles': 'Admin' },
    },
    {
      name: 'owner',
      query: { 'record.userId': { $ref: 'user._id' } },
    },
  ],
  update: {
    admin: ['jsonSchema.*', 'properties.age', 'name', 'urls'],
  },
});
