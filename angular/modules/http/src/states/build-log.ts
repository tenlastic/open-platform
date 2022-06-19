import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { BuildLog } from '../models/build-log';
import { BuildService } from '../services/build/build.service';

export interface BuildLogState extends EntityState<BuildLog> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: 'unix', name: 'build-logs', resettable: true })
export class BuildLogStore extends EntityStore<BuildLogState, BuildLog> {
  constructor(private buildService: BuildService) {
    super();

    this.buildService.onLogs.subscribe(records => this.upsertMany(records));
  }
}

@Injectable({ providedIn: 'root' })
export class BuildLogQuery extends QueryEntity<BuildLogState, BuildLog> {
  constructor(protected store: BuildLogStore) {
    super(store);
  }
}
