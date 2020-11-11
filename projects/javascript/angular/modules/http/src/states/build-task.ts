import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { BuildTask } from '../models/build-task';
import { BuildTaskService } from '../services/build-task/build-task.service';

export interface BuildTaskState extends EntityState<BuildTask> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'build-tasks' })
export class BuildTaskStore extends EntityStore<BuildTaskState, BuildTask> {
  constructor(private buildTaskService: BuildTaskService) {
    super();

    this.buildTaskService.onCreate.subscribe(record => this.add(record));
    this.buildTaskService.onDelete.subscribe(record => this.remove(record._id));
    this.buildTaskService.onRead.subscribe(records => this.upsertMany(records));
    this.buildTaskService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class BuildTaskQuery extends QueryEntity<BuildTaskState, BuildTask> {
  constructor(protected store: BuildTaskStore) {
    super(store);
  }
}
