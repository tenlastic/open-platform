import { SteamIntegrationModel } from '../models';
import { SteamIntegrationService } from '../services';
import { BaseState } from './base';

export class SteamIntegrationState extends BaseState<
  SteamIntegrationModel,
  SteamIntegrationService
> {
  constructor(service: SteamIntegrationService) {
    super('_id', service);
  }
}
