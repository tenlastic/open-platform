import { Injectable } from '@angular/core';
import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { Authorization, IAuthorization } from '../models/authorization';
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

  public hasRoles(namespaceId: string, roles: IAuthorization.AuthorizationRole[], userId: string) {
    return this.getRoles(namespaceId, userId).some((ro) => roles.includes(ro));
  }

  public getRoles(namespaceId: string, userId: string) {
    return this.getAll({
      filterBy: (a) => this.filterUserAuthorizations(a, namespaceId, userId),
    }).reduce((previous, current) => previous.concat(current.roles), []);
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

  public selectHasRoles(
    namespaceId: string,
    roles: IAuthorization.AuthorizationRole[],
    userId: string,
  ) {
    return this.selectRoles(namespaceId, userId).pipe(
      map((r) => r.some((ro) => roles.includes(ro))),
    );
  }

  public selectRoles(namespaceId: string, userId: string) {
    return this.selectAll({
      filterBy: (a) => this.filterUserAuthorizations(a, namespaceId, userId),
    }).pipe(map((a) => a.reduce((previous, current) => previous.concat(current.roles), [])));
  }

  private filterUserAuthorizations(
    authorization: Authorization,
    namespaceId: string,
    userId: string,
  ) {
    if (
      authorization.namespaceId &&
      namespaceId &&
      authorization.namespaceId === namespaceId &&
      userId &&
      authorization.userId === userId
    ) {
      return true;
    }

    if (
      authorization.namespaceId &&
      namespaceId &&
      authorization.namespaceId === namespaceId &&
      !authorization.userId
    ) {
      return true;
    }

    if (!authorization.namespaceId && userId && authorization.userId === userId) {
      return true;
    }

    return false;
  }
}
