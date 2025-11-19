import { SteamIntegrationModel, SteamIntegrationPermissionOptions } from '@tenlastic/mongoose';
import { count } from '@tenlastic/web-server';

export const handler = count(SteamIntegrationModel, SteamIntegrationPermissionOptions);
