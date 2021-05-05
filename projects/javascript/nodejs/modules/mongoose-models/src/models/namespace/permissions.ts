import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { UserPermissionsHelpers, UserRole } from '../user';
import { Namespace, NamespaceDocument, NamespaceRole } from './model';

export const NamespacePermissions = new MongoosePermissions<NamespaceDocument>(Namespace, {
  create: {
    'user-administrator': ['keys.*', 'limits.*', 'name', 'users.*'],
  },
  delete: {
    default: false,
    'user-administrator': true,
  },
  find: {
    default: {
      $or: [
        { keys: { $elemMatch: { roles: NamespaceRole.Namespaces, value: { $ref: 'key' } } } },
        { users: { $elemMatch: { _id: { $ref: 'user._id' }, roles: NamespaceRole.Namespaces } } },
      ],
    },
    'user-administrator': {},
  },
  read: {
    default: ['_id', 'createdAt', 'name', 'updatedAt'],
    'namespace-administrator': [
      '_id',
      'createdAt',
      'keys.*',
      'limits.*',
      'name',
      'updatedAt',
      'users.*',
    ],
    'user-administrator': [
      '_id',
      'createdAt',
      'keys.*',
      'limits.*',
      'name',
      'updatedAt',
      'users.*',
    ],
  },
  roles: [
    {
      name: 'user-administrator',
      query: UserPermissionsHelpers.getRoleQuery(UserRole.Namespaces),
    },
    {
      name: 'namespace-administrator',
      query: {
        $or: [
          {
            'record.keys': {
              $elemMatch: { roles: NamespaceRole.Namespaces, value: { $ref: 'key' } },
            },
          },
          {
            'record.users': {
              $elemMatch: { _id: { $ref: 'user._id' }, roles: NamespaceRole.Namespaces },
            },
          },
        ],
      },
    },
  ],
  update: {
    'namespace-administrator': ['keys.*', 'name', 'users.*'],
    'user-administrator': ['keys.*', 'limits.*', 'name', 'users.*'],
  },
});

export const NamespacePermissionsHelpers = {
  getFindQuery(role: NamespaceRole) {
    return {
      namespaceId: {
        $in: {
          $query: {
            model: 'NamespaceSchema',
            select: '_id',
            where: {
              $or: [
                { keys: { $elemMatch: { roles: role, value: { $ref: 'key' } } } },
                { users: { $elemMatch: { _id: { $ref: 'user._id' }, roles: role } } },
              ],
            },
          },
        },
      },
    };
  },
  getRoleQuery(role: NamespaceRole, selector = 'record.namespaceDocument') {
    return {
      $or: [
        { [`${selector}.keys`]: { $elemMatch: { roles: role, value: { $ref: 'key' } } } },
        { [`${selector}.users`]: { $elemMatch: { _id: { $ref: 'user._id' }, roles: role } } },
      ],
    };
  },
};
