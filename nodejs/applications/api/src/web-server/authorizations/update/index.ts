import { AuthorizationPermissions } from '../../../mongodb';
import { updateOne } from '@tenlastic/web-server';

export const handler = updateOne(AuthorizationPermissions);
