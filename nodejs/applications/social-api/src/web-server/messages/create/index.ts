import { MessagePermissions } from '@tenlastic/mongoose';
import { create } from '@tenlastic/web-server';

export const handler = create(MessagePermissions);
