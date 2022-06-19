import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { QueueLog } from '../models/queue-log';
import { QueueService } from '../services/queue/queue.service';

export interface QueueLogState extends EntityState<QueueLog> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: 'unix', name: 'queue-logs', resettable: true })
export class QueueLogStore extends EntityStore<QueueLogState, QueueLog> {
  constructor(private queueService: QueueService) {
    super();

    this.queueService.onLogs.subscribe(records => this.upsertMany(records));
  }
}

@Injectable({ providedIn: 'root' })
export class QueueLogQuery extends QueryEntity<QueueLogState, QueueLog> {
  constructor(protected store: QueueLogStore) {
    super(store);
  }
}
