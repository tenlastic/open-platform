import { GameServerPermissions } from '../../../mongodb';
import { find } from '@tenlastic/web-server';

export const handler = find(GameServerPermissions);
