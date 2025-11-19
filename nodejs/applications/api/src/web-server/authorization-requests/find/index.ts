import {
  AuthorizationRequestModel,
  AuthorizationRequestPermissionOptions,
} from '@tenlastic/mongoose';
import { find } from '@tenlastic/web-server';

export const handler = find(AuthorizationRequestModel, AuthorizationRequestPermissionOptions);
