import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { RefreshToken } from '../models/refresh-token';
import { RefreshTokenService } from '../services/refresh-token/refresh-token.service';

export interface RefreshTokenState extends EntityState<RefreshToken> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'refreshtokens', resettable: true })
export class RefreshTokenStore extends EntityStore<RefreshTokenState, RefreshToken> {
  constructor(private refreshTokenService: RefreshTokenService) {
    super();

    this.refreshTokenService.onCreate.subscribe(record => this.add(record));
    this.refreshTokenService.onDelete.subscribe(record => this.remove(record._id));
    this.refreshTokenService.onRead.subscribe(records => this.upsertMany(records));
    this.refreshTokenService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class RefreshTokenQuery extends QueryEntity<RefreshTokenState, RefreshToken> {
  constructor(protected store: RefreshTokenStore) {
    super(store);
  }
}
