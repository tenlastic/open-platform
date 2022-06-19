import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GameAuthorization } from '../models/game-authorization';
import { GameAuthorizationService } from '../services/game-authorization/game-authorization.service';
import { GameQuery } from './game';
import { NamespaceQuery } from './namespace';
import { UserQuery } from './user';

export interface GameAuthorizationState extends EntityState<GameAuthorization> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'game-authorizations', resettable: true })
export class GameAuthorizationStore extends EntityStore<GameAuthorizationState, GameAuthorization> {
  constructor(private gameAuthorizationService: GameAuthorizationService) {
    super();

    this.gameAuthorizationService.onCreate.subscribe(record => this.add(record));
    this.gameAuthorizationService.onDelete.subscribe(record => this.remove(record._id));
    this.gameAuthorizationService.onRead.subscribe(records => this.upsertMany(records));
    this.gameAuthorizationService.onUpdate.subscribe(record => this.upsert(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class GameAuthorizationQuery extends QueryEntity<GameAuthorizationState, GameAuthorization> {
  constructor(
    protected gameQuery: GameQuery,
    protected namespaceQuery: NamespaceQuery,
    protected store: GameAuthorizationStore,
    protected userQuery: UserQuery,
  ) {
    super(store);
  }

  public populate($input: Observable<GameAuthorization[]>) {
    return combineLatest([
      $input,
      this.gameQuery.selectAll({ asObject: true }),
      this.namespaceQuery.selectAll({ asObject: true }),
      this.userQuery.selectAll({ asObject: true }),
    ]).pipe(
      map(([gameAuthorizations, games, namespaces, users]) => {
        return gameAuthorizations.map(gameAuthorization => {
          return new GameAuthorization({
            ...gameAuthorization,
            game: games[gameAuthorization.gameId],
            namespace: namespaces[gameAuthorization.namespaceId],
            user: users[gameAuthorization.userId],
          });
        });
      }),
    );
  }
}
