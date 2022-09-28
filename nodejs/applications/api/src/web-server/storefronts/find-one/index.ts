import { StorefrontPermissions } from '../../../mongodb';
import { findOne } from '@tenlastic/web-server';

export const handler = findOne(StorefrontPermissions);
