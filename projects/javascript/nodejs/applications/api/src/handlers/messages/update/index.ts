import { MessagePermissions } from '@tenlastic/mongoose-models';
import { updateOne } from '@tenlastic/web-server';

export const handler = updateOne(MessagePermissions);
