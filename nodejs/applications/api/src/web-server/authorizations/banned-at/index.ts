import { AuthorizationModel, AuthorizationPermissionOptions } from '@tenlastic/mongoose';
import { updateOneDate } from '@tenlastic/web-server';

export const handler = updateOneDate(
  'bannedAt',
  AuthorizationModel,
  AuthorizationPermissionOptions,
);
