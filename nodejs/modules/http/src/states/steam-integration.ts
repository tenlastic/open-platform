import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { SteamIntegrationModel } from '../models/steam-integration';
import { BaseStore } from './base';

export interface SteamIntegrationState extends EntityState<SteamIntegrationModel> {}

@StoreConfig({
  idKey: '_id',
  deepFreezeFn: (o) => o,
  name: 'steamintegrations',
  resettable: true,
})
export class SteamIntegrationStore extends BaseStore<
  SteamIntegrationState,
  SteamIntegrationModel
> {}

export class SteamIntegrationQuery extends QueryEntity<
  SteamIntegrationState,
  SteamIntegrationModel
> {
  constructor(protected store: SteamIntegrationStore) {
    super(store);
  }
}
