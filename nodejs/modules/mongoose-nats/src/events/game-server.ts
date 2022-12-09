import { GameServerDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const GameServerEvent = new EventEmitter<DatabasePayload<GameServerDocument>>();