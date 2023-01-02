import { BuildDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const BuildEvent = new EventEmitter<DatabasePayload<BuildDocument>>();
