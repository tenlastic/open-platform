import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { RefreshToken, RefreshTokenDocument } from './model';

export const RefreshTokenPermissions = new MongoosePermissions<RefreshTokenDocument>(RefreshToken, {
  create: {
    base: ['description', 'expiresAt'],
  },
  delete: {
    base: false,
    roles: {
      owner: true,
    },
  },
  find: {
    base: { userId: { $eq: { $ref: 'user._id' } } },
  },
  read: {
    base: ['_id', 'createdAt', 'description', 'expiresAt', 'updatedAt', 'userId'],
  },
  roles: [{ name: 'owner', query: { 'record.userId': { $eq: { $ref: 'user._id' } } } }],
  update: {
    base: [],
    roles: {
      owner: ['description'],
    },
  },
});
