import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { Log } from '../models/log';
import { LogService } from '../services/log/log.service';
import { GameServerQuery } from './game-server';

export interface LogState extends EntityState<Log> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'logs' })
export class LogStore extends EntityStore<LogState, Log> {
  constructor(private gameInvitationService: LogService) {
    super();

    this.gameInvitationService.onCreate.subscribe(record => this.add(record));
    this.gameInvitationService.onDelete.subscribe(record => this.remove(record._id));
    this.gameInvitationService.onRead.subscribe(records => this.upsertMany(records));
    this.gameInvitationService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class LogQuery extends QueryEntity<LogState, Log> {
  constructor(private gameServerQuery: GameServerQuery, protected store: LogStore) {
    super(store);
  }

  public populate($input: Observable<Log[]>) {
    return combineLatest([$input, this.gameServerQuery.selectAll({ asObject: true })]).pipe(
      map(([gameInvitations, gameServers]) => {
        return gameInvitations.map(gameInvitation => {
          return new Log({
            ...gameInvitation,
            gameServer: gameServers[gameInvitation.gameServerId],
          });
        });
      }),
    );
  }
}
