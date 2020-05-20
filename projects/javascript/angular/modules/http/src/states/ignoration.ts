import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { Ignoration } from '../models/ignoration';
import { IgnorationService } from '../services/ignoration/ignoration.service';
import { UserQuery } from './user';

export interface IgnorationState extends EntityState<Ignoration> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'ignorations' })
export class IgnorationStore extends EntityStore<IgnorationState, Ignoration> {
  constructor(private ignorationService: IgnorationService) {
    super();

    this.ignorationService.onCreate.subscribe(record => this.add(record));
    this.ignorationService.onDelete.subscribe(record => this.remove(record._id));
    this.ignorationService.onRead.subscribe(records => this.upsertMany(records));
    this.ignorationService.onUpdate.subscribe(record => this.update(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class IgnorationQuery extends QueryEntity<IgnorationState, Ignoration> {
  constructor(protected store: IgnorationStore, private userQuery: UserQuery) {
    super(store);
  }

  public populateUsers($input: Observable<Ignoration[]>) {
    return combineLatest([$input, this.userQuery.selectAll({ asObject: true })]).pipe(
      map(([ignorations, users]) => {
        return ignorations.map(ignoration => {
          return new Ignoration({
            ...ignoration,
            fromUser: users[ignoration.fromUserId],
            toUser: users[ignoration.toUserId],
          });
        });
      }),
    );
  }
}
