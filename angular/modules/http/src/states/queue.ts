import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Queue } from '../models/queue';
import { QueueService } from '../services/queue/queue.service';
import { BuildQuery } from './build';

export interface QueueState extends EntityState<Queue> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'queues', resettable: true })
export class QueueStore extends EntityStore<QueueState, Queue> {
  constructor(private queueService: QueueService) {
    super();

    this.queueService.onCreate.subscribe((record) => this.add(record));
    this.queueService.onDelete.subscribe((record) => this.remove(record._id));
    this.queueService.onRead.subscribe((records) => this.upsertMany(records));
    this.queueService.onUpdate.subscribe((record) => this.upsert(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class QueueQuery extends QueryEntity<QueueState, Queue> {
  constructor(protected buildQuery: BuildQuery, protected store: QueueStore) {
    super(store);
  }

  public populate($input: Observable<Queue[]>) {
    return combineLatest([$input, this.buildQuery.selectAll({ asObject: true })]).pipe(
      map(([queues, builds]) => {
        return queues.map((queue) => {
          return new Queue({
            ...queue,
            build: builds[queue.buildId],
          });
        });
      }),
    );
  }
}
