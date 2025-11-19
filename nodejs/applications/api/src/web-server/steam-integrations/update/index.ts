import { SteamIntegrationModel, SteamIntegrationPermissionOptions } from '@tenlastic/mongoose';
import { updateOne } from '@tenlastic/web-server';

export const handler = updateOne(SteamIntegrationModel, SteamIntegrationPermissionOptions);
