import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { Queue } from '../models/queue';
import { QueueService } from '../services/queue/queue.service';

export interface QueueState extends EntityState<Queue> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'queues' })
export class QueueStore extends EntityStore<QueueState, Queue> {
  constructor(private queueService: QueueService) {
    super();

    this.queueService.onCreate.subscribe(record => this.add(record));
    this.queueService.onDelete.subscribe(record => this.remove(record._id));
    this.queueService.onRead.subscribe(records => this.upsertMany(records));
    this.queueService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class QueueQuery extends QueryEntity<QueueState, Queue> {
  constructor(protected store: QueueStore) {
    super(store);
  }
}
