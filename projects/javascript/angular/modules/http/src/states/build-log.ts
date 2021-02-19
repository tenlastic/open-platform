import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { BuildLog } from '../models/build-log';
import { BuildLogService } from '../services/build-log/build-log.service';
import { BuildQuery } from './build';

export interface BuildLogState extends EntityState<BuildLog> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'build-logs' })
export class BuildLogStore extends EntityStore<BuildLogState, BuildLog> {
  constructor(private buildLogService: BuildLogService) {
    super();

    this.buildLogService.onCreate.subscribe(record => this.add(record));
    this.buildLogService.onDelete.subscribe(record => this.remove(record._id));
    this.buildLogService.onRead.subscribe(records => this.upsertMany(records));
    this.buildLogService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class BuildLogQuery extends QueryEntity<BuildLogState, BuildLog> {
  constructor(private buildQuery: BuildQuery, protected store: BuildLogStore) {
    super(store);
  }

  public populate($input: Observable<BuildLog[]>) {
    return combineLatest([$input, this.buildQuery.selectAll({ asObject: true })]).pipe(
      map(([buildLogs, builds]) => {
        return buildLogs.map(buildLog => {
          return new BuildLog({
            ...buildLog,
            build: builds[buildLog.buildId],
          });
        });
      }),
    );
  }
}
