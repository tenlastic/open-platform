import { SteamIntegrationModel, SteamIntegrationPermissionOptions } from '@tenlastic/mongoose';
import { find } from '@tenlastic/web-server';

export const handler = find(SteamIntegrationModel, SteamIntegrationPermissionOptions);
