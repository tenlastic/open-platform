import { count } from '@tenlastic/web-server';

import { AuthorizationRequestPermissions } from '../../../mongodb';

export const handler = count(AuthorizationRequestPermissions);
