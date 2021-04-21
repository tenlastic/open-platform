import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GameInvitation } from '../models/game-invitation';
import { GameInvitationService } from '../services/game-invitation/game-invitation.service';
import { GameQuery } from './game';
import { NamespaceQuery } from './namespace';
import { UserQuery } from './user';

export interface GameInvitationState extends EntityState<GameInvitation> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'game-invitations', resettable: true })
export class GameInvitationStore extends EntityStore<GameInvitationState, GameInvitation> {
  constructor(private gameInvitationService: GameInvitationService) {
    super();

    this.gameInvitationService.onCreate.subscribe(record => this.add(record));
    this.gameInvitationService.onDelete.subscribe(record => this.remove(record._id));
    this.gameInvitationService.onRead.subscribe(records => this.upsertMany(records));
    this.gameInvitationService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class GameInvitationQuery extends QueryEntity<GameInvitationState, GameInvitation> {
  constructor(
    private gameQuery: GameQuery,
    private namespaceQuery: NamespaceQuery,
    protected store: GameInvitationStore,
    private userQuery: UserQuery,
  ) {
    super(store);
  }

  public populate($input: Observable<GameInvitation[]>) {
    return combineLatest([
      $input,
      this.gameQuery.selectAll({ asObject: true }),
      this.namespaceQuery.selectAll({ asObject: true }),
      this.userQuery.selectAll({ asObject: true }),
    ]).pipe(
      map(([gameInvitations, games, namespaces, users]) => {
        return gameInvitations.map(gameInvitation => {
          return new GameInvitation({
            ...gameInvitation,
            game: games[gameInvitation.gameId],
            namespace: namespaces[gameInvitation.namespaceId],
            user: users[gameInvitation.userId],
          });
        });
      }),
    );
  }
}
