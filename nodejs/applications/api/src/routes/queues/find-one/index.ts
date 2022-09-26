import { QueuePermissions } from '../../../mongodb';
import { findOne } from '@tenlastic/web-server';

export const handler = findOne(QueuePermissions);
