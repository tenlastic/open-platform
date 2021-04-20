import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { Game } from '../models/game';
import { GameService } from '../services/game/game.service';

export interface GameState extends EntityState<Game> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'games', resettable: true })
export class GameStore extends EntityStore<GameState, Game> {
  constructor(private gameService: GameService) {
    super();

    this.gameService.onCreate.subscribe(record => this.add(record));
    this.gameService.onDelete.subscribe(record => this.remove(record._id));
    this.gameService.onRead.subscribe(records => this.upsertMany(records));
    this.gameService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class GameQuery extends QueryEntity<GameState, Game> {
  constructor(protected store: GameStore) {
    super(store);
  }
}
