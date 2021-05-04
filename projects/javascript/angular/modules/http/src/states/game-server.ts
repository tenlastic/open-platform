import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { GameServer } from '../models/game-server';
import { GameServerService } from '../services/game-server/game-server.service';
import { GameQuery } from './game';
import { QueueQuery } from './queue';

export interface GameServerState extends EntityState<GameServer> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'game-servers', resettable: true })
export class GameServerStore extends EntityStore<GameServerState, GameServer> {
  constructor(private gameServerService: GameServerService) {
    super();

    this.gameServerService.onCreate.subscribe(record => this.add(record));
    this.gameServerService.onDelete.subscribe(record => this.remove(record._id));
    this.gameServerService.onRead.subscribe(records => this.upsertMany(records));
    this.gameServerService.onUpdate.subscribe(record => this.upsert(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class GameServerQuery extends QueryEntity<GameServerState, GameServer> {
  constructor(
    protected gameQuery: GameQuery,
    protected store: GameServerStore,
    private queueQuery: QueueQuery,
  ) {
    super(store);
  }

  public populate($input: Observable<GameServer[]>) {
    return combineLatest([
      $input,
      this.gameQuery.selectAll({ asObject: true }),
      this.queueQuery.selectAll({ asObject: true }),
    ]).pipe(
      map(([gameServers, games, queues]) => {
        return gameServers.map(gameServer => {
          return new GameServer({
            ...gameServer,
            game: games[gameServer.gameId],
            queue: queues[gameServer.queueId],
          });
        });
      }),
    );
  }
}
