import { create } from '@tenlastic/web-server';

import { AuthorizationRequestPermissions } from '../../../mongodb';

export const handler = create(AuthorizationRequestPermissions);
