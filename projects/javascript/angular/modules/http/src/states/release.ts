import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { Release } from '../models/release';
import { ReleaseService } from '../services/release/release.service';

export interface ReleaseState extends EntityState<Release> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'releases' })
export class ReleaseStore extends EntityStore<ReleaseState, Release> {
  constructor(private releaseService: ReleaseService) {
    super();

    this.releaseService.onCreate.subscribe(record => this.add(record));
    this.releaseService.onDelete.subscribe(record => this.remove(record._id));
    this.releaseService.onRead.subscribe(records => this.upsertMany(records));
    this.releaseService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class ReleaseQuery extends QueryEntity<ReleaseState, Release> {
  constructor(protected store: ReleaseStore) {
    super(store);
  }
}
