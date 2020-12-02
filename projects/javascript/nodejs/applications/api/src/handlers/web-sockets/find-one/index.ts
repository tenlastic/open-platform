import { WebSocketPermissions } from '@tenlastic/mongoose-models';

import { findOne } from '../../../defaults';

export const handler = findOne(WebSocketPermissions);
