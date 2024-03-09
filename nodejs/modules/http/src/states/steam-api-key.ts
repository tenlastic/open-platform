import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { SteamApiKeyModel } from '../models/steam-api-key';
import { BaseStore } from './base';

export interface SteamApiKeyState extends EntityState<SteamApiKeyModel> {}

@StoreConfig({
  idKey: '_id',
  deepFreezeFn: (o) => o,
  name: 'steamapikeys',
  resettable: true,
})
export class SteamApiKeyStore extends BaseStore<SteamApiKeyState, SteamApiKeyModel> {}

export class SteamApiKeyQuery extends QueryEntity<SteamApiKeyState, SteamApiKeyModel> {
  constructor(protected store: SteamApiKeyStore) {
    super(store);
  }
}
