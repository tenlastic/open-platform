import { BuildPermissions } from '../../../../mongodb';
import { updateOne } from '@tenlastic/web-server';

export const handler = updateOne(BuildPermissions);
