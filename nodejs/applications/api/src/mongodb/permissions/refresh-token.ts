import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { RefreshToken, RefreshTokenDocument } from '../models';

export const RefreshTokenPermissions = new MongoosePermissions<RefreshTokenDocument>(RefreshToken, {
  create: {
    default: ['description', 'expiresAt'],
  },
  delete: {
    default: false,
    owner: true,
  },
  find: {
    default: { userId: { $ref: 'user._id' } },
  },
  read: {
    default: ['_id', 'createdAt', 'description', 'expiresAt', 'updatedAt', 'userId'],
  },
  roles: {
    default: {},
    owner: { 'record.userId': { $ref: 'user._id' } },
  },
  update: {
    owner: ['description'],
  },
});
