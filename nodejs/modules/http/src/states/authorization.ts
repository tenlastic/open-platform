import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';
import { map } from 'rxjs/operators';

import { AuthorizationModel, IAuthorization } from '../models/authorization';

export interface AuthorizationState extends EntityState<AuthorizationModel> {}

@StoreConfig({ deepFreezeFn: (o) => o, idKey: '_id', name: 'authorizations', resettable: true })
export class AuthorizationStore extends EntityStore<AuthorizationState, AuthorizationModel> {}

export class AuthorizationQuery extends QueryEntity<AuthorizationState, AuthorizationModel> {
  constructor(protected store: AuthorizationStore) {
    super(store);
  }

  public hasRoles(namespaceId: string, roles: IAuthorization.Role[], userId: string) {
    const authorizations = this.getAll({
      filterBy: (a) => this.filterUserAuthorizations(a, namespaceId, userId),
    });

    if (authorizations.some((a) => a.bannedAt)) {
      return false;
    }

    return authorizations
      .reduce((previous, current) => previous.concat(current.roles), [])
      .some((ro) => roles.includes(ro));
  }

  public selectHasRoles(namespaceId: string, roles: IAuthorization.Role[], userId: string) {
    return this.selectAll({
      filterBy: (a) => this.filterUserAuthorizations(a, namespaceId, userId),
    }).pipe(
      map((as) => (as.some((a) => a.bannedAt) ? [] : as)),
      map((as) => as.reduce((previous, current) => previous.concat(current.roles), [])),
      map((r) => r.some((ro) => roles.includes(ro))),
    );
  }

  private filterUserAuthorizations(
    authorization: AuthorizationModel,
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
