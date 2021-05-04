import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { GameServerLog } from '../models/game-server-log';
import { GameServerLogService } from '../services/game-server-log/game-server-log.service';
import { GameServerQuery } from './game-server';

export interface GameServerLogState extends EntityState<GameServerLog> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'game-server-logs', resettable: true })
export class GameServerLogStore extends EntityStore<GameServerLogState, GameServerLog> {
  constructor(private gameServerLogService: GameServerLogService) {
    super();

    this.gameServerLogService.onCreate.subscribe(record => this.add(record));
    this.gameServerLogService.onDelete.subscribe(record => this.remove(record._id));
    this.gameServerLogService.onRead.subscribe(records => this.upsertMany(records));
    this.gameServerLogService.onUpdate.subscribe(record => this.upsert(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class GameServerLogQuery extends QueryEntity<GameServerLogState, GameServerLog> {
  constructor(private gameServerQuery: GameServerQuery, protected store: GameServerLogStore) {
    super(store);
  }

  public populate($input: Observable<GameServerLog[]>) {
    return combineLatest([$input, this.gameServerQuery.selectAll({ asObject: true })]).pipe(
      map(([gameServerLogs, gameServers]) => {
        return gameServerLogs.map(gameServerLog => {
          return new GameServerLog({
            ...gameServerLog,
            gameServer: gameServers[gameServerLog.gameServerId],
          });
        });
      }),
    );
  }
}
