import { WebSocketPermissions } from '../../../../mongodb';
import { count } from '@tenlastic/web-server';

export const handler = count(WebSocketPermissions);
