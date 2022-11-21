import { deleteOne } from '@tenlastic/web-server';

import { AuthorizationRequestPermissions } from '../../../mongodb';

export const handler = deleteOne(AuthorizationRequestPermissions);
