import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { Build } from '../models/build';
import { BuildService } from '../services/build/build.service';

export interface BuildState extends EntityState<Build> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'builds' })
export class BuildStore extends EntityStore<BuildState, Build> {
  constructor(private buildService: BuildService) {
    super();

    this.buildService.onCreate.subscribe(record => this.add(record));
    this.buildService.onDelete.subscribe(record => this.remove(record._id));
    this.buildService.onRead.subscribe(records => this.upsertMany(records));
    this.buildService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class BuildQuery extends QueryEntity<BuildState, Build> {
  constructor(protected store: BuildStore) {
    super(store);
  }
}
