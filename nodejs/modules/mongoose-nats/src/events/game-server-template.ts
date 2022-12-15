import { GameServerTemplateDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const GameServerTemplateEvent = new EventEmitter<
  DatabasePayload<GameServerTemplateDocument>
>();
