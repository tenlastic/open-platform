import { ArticleDocument } from '@tenlastic/mongoose';

import { DatabasePayload } from '../database-payload';
import { EventEmitter } from '../event-emitter';

export const ArticleEvent = new EventEmitter<DatabasePayload<ArticleDocument>>();
