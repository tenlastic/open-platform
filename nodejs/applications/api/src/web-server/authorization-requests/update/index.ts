import {
  AuthorizationRequestModel,
  AuthorizationRequestPermissionOptions,
} from '@tenlastic/mongoose';
import { updateOne } from '@tenlastic/web-server';

export const handler = updateOne(AuthorizationRequestModel, AuthorizationRequestPermissionOptions);
