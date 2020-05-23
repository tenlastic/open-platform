import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { GameServer } from '../models/game-server';
import { GameServerService } from '../services/game-server/game-server.service';

export interface GameServerState extends EntityState<GameServer> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'game-servers' })
export class GameServerStore extends EntityStore<GameServerState, GameServer> {
  constructor(private gameServerService: GameServerService) {
    super();

    this.gameServerService.onCreate.subscribe(record => this.add(record));
    this.gameServerService.onDelete.subscribe(record => this.remove(record._id));
    this.gameServerService.onRead.subscribe(records => this.upsertMany(records));
    this.gameServerService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class GameServerQuery extends QueryEntity<GameServerState, GameServer> {
  constructor(protected store: GameServerStore) {
    super(store);
  }
}
