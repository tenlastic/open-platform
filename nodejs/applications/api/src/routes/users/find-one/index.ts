import { UserPermissions } from '../../../mongodb';
import { findOne } from '@tenlastic/web-server';

export const handler = findOne(UserPermissions);
