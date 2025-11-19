import { SteamIntegrationModel, SteamIntegrationPermissionOptions } from '@tenlastic/mongoose';
import { findOne } from '@tenlastic/web-server';

export const handler = findOne(SteamIntegrationModel, SteamIntegrationPermissionOptions);
