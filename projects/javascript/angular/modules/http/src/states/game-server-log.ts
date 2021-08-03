import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { GameServerLog } from '../models/game-server-log';
import { GameServerService } from '../services/game-server/game-server.service';

export interface GameServerLogState extends EntityState<GameServerLog> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: 'unix', name: 'game-server-logs', resettable: true })
export class GameServerLogStore extends EntityStore<GameServerLogState, GameServerLog> {
  constructor(private gameServerService: GameServerService) {
    super();

    this.gameServerService.onLogs.subscribe(records => this.upsertMany(records));
  }
}

@Injectable({ providedIn: 'root' })
export class GameServerLogQuery extends QueryEntity<GameServerLogState, GameServerLog> {
  constructor(protected store: GameServerLogStore) {
    super(store);
  }
}
