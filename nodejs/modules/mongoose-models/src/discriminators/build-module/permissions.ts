import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import {
  NamespacePermissionsHelpers,
  NamespaceRole,
  UserPermissionsHelpers,
  UserRole,
} from '../../models';
import { BuildModule, BuildModuleDocument } from './model';

export const BuildModulePermissions = new MongoosePermissions<BuildModuleDocument>(BuildModule, {
  create: {
    'namespace-administrator': ['resources.*'],
    'user-administrator': ['limits.*', 'resources.*'],
  },
  delete: {
    'namespace-administrator': true,
    'system-administrator': true,
    'user-administrator': true,
  },
  find: {
    default: {
      $or: [
        NamespacePermissionsHelpers.getFindQuery(NamespaceRole.Modules),
        NamespacePermissionsHelpers.getNamespaceUserFindQuery(NamespaceRole.Modules),
      ],
    },
    'user-administrator': {},
  },
  populate: [{ path: 'namespaceDocument' }],
  read: {
    default: ['limits.*', 'resources.*', 'status.*'],
  },
  roles: [
    {
      name: 'system-administrator',
      query: NamespacePermissionsHelpers.getNamespaceUserRoleQuery(NamespaceRole.Modules),
    },
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Modules),
    },
    {
      name: 'namespace-administrator',
      query: NamespacePermissionsHelpers.getRoleQuery(NamespaceRole.Modules),
    },
  ],
  update: {
    'namespace-administrator': ['resources.*'],
    'system-administrator': ['status.*'],
    'user-administrator': ['limits.*', 'resources.*'],
  },
});
