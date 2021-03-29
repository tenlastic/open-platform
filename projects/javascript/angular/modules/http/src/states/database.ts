import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Database } from '../models/database';
import { DatabaseService } from '../services/database/database.service';
import { GameQuery } from './game';

export interface DatabaseState extends EntityState<Database> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'databases' })
export class DatabaseStore extends EntityStore<DatabaseState, Database> {
  constructor(private databaseService: DatabaseService) {
    super();

    this.databaseService.onCreate.subscribe(record => this.add(record));
    this.databaseService.onDelete.subscribe(record => this.remove(record._id));
    this.databaseService.onRead.subscribe(records => this.upsertMany(records));
    this.databaseService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class DatabaseQuery extends QueryEntity<DatabaseState, Database> {
  constructor(protected gameQuery: GameQuery, protected store: DatabaseStore) {
    super(store);
  }

  public populate($input: Observable<Database[]>) {
    return combineLatest([$input, this.gameQuery.selectAll({ asObject: true })]).pipe(
      map(([queues, games]) => {
        return queues.map(queue => {
          return new Database({
            ...queue,
            game: games[queue.gameId],
          });
        });
      }),
    );
  }
}
