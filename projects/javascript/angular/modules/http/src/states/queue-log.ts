import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { QueueLog } from '../models/queue-log';
import { QueueLogService } from '../services/queue-log/queue-log.service';
import { QueueQuery } from './queue';

export interface QueueLogState extends EntityState<QueueLog> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'queuelogs' })
export class QueueLogStore extends EntityStore<QueueLogState, QueueLog> {
  constructor(private queueLogService: QueueLogService) {
    super();

    this.queueLogService.onCreate.subscribe(record => this.add(record));
    this.queueLogService.onDelete.subscribe(record => this.remove(record._id));
    this.queueLogService.onRead.subscribe(records => this.upsertMany(records));
    this.queueLogService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class QueueLogQuery extends QueryEntity<QueueLogState, QueueLog> {
  constructor(private queueQuery: QueueQuery, protected store: QueueLogStore) {
    super(store);
  }

  public populate($input: Observable<QueueLog[]>) {
    return combineLatest([$input, this.queueQuery.selectAll({ asObject: true })]).pipe(
      map(([queueLogs, queues]) => {
        return queueLogs.map(queueLog => {
          return new QueueLog({
            ...queueLog,
            queue: queues[queueLog.queueId],
          });
        });
      }),
    );
  }
}
