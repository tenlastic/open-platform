import { Example, ExampleDocument } from './model';
import { MongoosePermissions } from '../mongoose-permissions';

export const ExamplePermissions = new MongoosePermissions<ExampleDocument>(Example, {
  create: {
    roles: {
      admin: ['properties.age', 'name', 'urls'],
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
  populate: [{ path: 'parent' }],
  read: {
    base: ['_id', 'createdAt', 'updatedAt'],
    roles: {
      admin: ['jsonSchema.*', 'properties.age', 'properties.name', 'name', 'urls'],
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
      admin: ['jsonSchema.*', 'properties.age', 'name', 'urls'],
    },
  },
});
