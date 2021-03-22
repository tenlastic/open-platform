import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Queue } from '../models/queue';
import { QueueService } from '../services/queue/queue.service';
import { GameQuery } from './game';

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
  constructor(protected gameQuery: GameQuery, protected store: QueueStore) {
    super(store);
  }

  public populate($input: Observable<Queue[]>) {
    return combineLatest([$input, this.gameQuery.selectAll({ asObject: true })]).pipe(
      map(([queues, games]) => {
        return queues.map(queue => {
          return new Queue({
            ...queue,
            game: games[queue.gameId],
          });
        });
      }),
    );
  }
}
