import { findOne } from '@tenlastic/web-server';

import { AuthorizationRequestPermissions } from '../../../mongodb';

export const handler = findOne(AuthorizationRequestPermissions);
