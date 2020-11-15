import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { RefreshToken, RefreshTokenDocument } from './model';

export const RefreshTokenPermissions = new MongoosePermissions<RefreshTokenDocument>(RefreshToken, {
  create: {
    default: ['description', 'expiresAt'],
  },
  delete: {
    default: false,
    owner: true,
  },
  find: {
    default: { userId: { $eq: { $ref: 'user._id' } } },
  },
  read: {
    default: ['_id', 'createdAt', 'description', 'expiresAt', 'updatedAt', 'userId'],
  },
  roles: [{ name: 'owner', query: { 'record.userId': { $eq: { $ref: 'user._id' } } } }],
  update: {
    default: [],
    owner: ['description'],
  },
});
