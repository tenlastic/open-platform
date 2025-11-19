import { IOptions } from '@tenlastic/mongoose-permissions';

import { RefreshTokenDocument } from '../models';

export const RefreshTokenPermissionOptions: IOptions<RefreshTokenDocument> = {
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
};
