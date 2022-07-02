import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Authorization } from '../models/authorization';
import { AuthorizationService } from '../services/authorization/authorization.service';
import { NamespaceQuery } from './namespace';
import { UserQuery } from './user';

export interface AuthorizationState extends EntityState<Authorization> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ idKey: '_id', name: 'authorizations', resettable: true })
export class AuthorizationStore extends EntityStore<AuthorizationState, Authorization> {
  constructor(private authorizationService: AuthorizationService) {
    super();

    this.authorizationService.onCreate.subscribe((record) => this.add(record));
    this.authorizationService.onDelete.subscribe((record) => this.remove(record._id));
    this.authorizationService.onRead.subscribe((records) => this.upsertMany(records));
    this.authorizationService.onUpdate.subscribe((record) => this.upsert(record._id, record));
  }
}

@Injectable({ providedIn: 'root' })
export class AuthorizationQuery extends QueryEntity<AuthorizationState, Authorization> {
  constructor(
    protected namespaceQuery: NamespaceQuery,
    protected store: AuthorizationStore,
    protected userQuery: UserQuery,
  ) {
    super(store);
  }

  public populate($input: Observable<Authorization[]>) {
    return combineLatest([
      $input,
      this.namespaceQuery.selectAll({ asObject: true }),
      this.userQuery.selectAll({ asObject: true }),
    ]).pipe(
      map(([authorizations, namespaces, users]) => {
        return authorizations.map((authorization) => {
          return new Authorization({
            ...authorization,
            namespace: namespaces[authorization.namespaceId],
            user: users[authorization.userId],
          });
        });
      }),
    );
  }
}
