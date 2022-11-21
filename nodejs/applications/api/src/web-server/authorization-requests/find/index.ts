import { find } from '@tenlastic/web-server';

import { AuthorizationRequestPermissions } from '../../../mongodb';

export const handler = find(AuthorizationRequestPermissions);
