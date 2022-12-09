import { WebSocketDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const WebSocketEvent = new EventEmitter<DatabasePayload<WebSocketDocument>>();