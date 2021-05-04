import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { NamespacePermissionsHelpers, NamespaceRole } from '../namespace';
import { UserPermissionsHelpers, UserRole } from '../user';
import { BuildLog, BuildLogDocument } from './model';

export const BuildLogPermissions = new MongoosePermissions<BuildLogDocument>(BuildLog, {
  create: {
    'system-administrator': ['body', 'buildId', 'namespaceId', 'nodeId', 'unix'],
  },
  find: {
    default: NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Builds),
    'system-administrator': {},
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: [
      '_id',
      'body',
      'buildId',
      'createdAt',
      'expiresAt',
      'namespaceId',
      'nodeId',
      'unix',
      'updatedAt',
    ],
  },
  roles: [
    {
      name: 'system-administrator',
      query: { 'user.roles': UserRole.Builds, 'user.system': true },
    },
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Builds),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.Builds),
    },
  ],
});
