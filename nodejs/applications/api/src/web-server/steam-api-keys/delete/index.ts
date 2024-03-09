import { SteamApiKeyPermissions } from '@tenlastic/mongoose';
import { deleteOne } from '@tenlastic/web-server';

export const handler = deleteOne(SteamApiKeyPermissions);
