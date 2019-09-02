import { Example, ExampleDocument } from './model';
import { MongoosePermissions } from '../mongoose-permissions/mongoose-permissions';

export const ExamplePermissions = new MongoosePermissions<ExampleDocument>(Example, {
  create: {
    roles: {
      admin: ['customProperties.age', 'name'],
    },
  },
  delete: {
    roles: {
      admin: true,
    },
  },
  find: {
    roles: {
      admin: {},
    },
  },
  populate: { path: 'parent' },
  read: {
    base: ['_id', 'createdAt', 'updatedAt'],
    roles: {
      admin: ['customProperties.age', 'name'],
    },
  },
  roles: [
    {
      name: 'admin',
      query: { 'user.roles': { $eq: 'Admin' } },
    },
    {
      name: 'owner',
      query: { 'record.userId': { $eq: { $ref: 'user._id' } } },
    },
  ],
  update: {
    roles: {
      admin: ['customProperties.age', 'name'],
    },
  },
});
