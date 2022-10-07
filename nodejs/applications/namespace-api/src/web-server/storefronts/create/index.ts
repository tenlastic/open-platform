import { StorefrontPermissions } from '../../../mongodb';
import { create } from '@tenlastic/web-server';

export const handler = create(StorefrontPermissions);
