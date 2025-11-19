import { map } from 'rxjs';

import { AuthorizationModel, IAuthorization } from '../models';
import { AuthorizationService } from '../services';
import { BaseState } from './base';

export class AuthorizationState extends BaseState<AuthorizationModel, AuthorizationService> {
  constructor(service: AuthorizationService) {
    super('_id', service);
  }

  public hasRoles(namespaceId: string, roles: IAuthorization.Role[], userId: string) {
    const authorizations = this.getMany().filter((a) =>
      this.filterUserAuthorizations(a, namespaceId, userId),
    );

    if (authorizations.some((a) => a.bannedAt)) {
      return false;
    }

    return authorizations
      .reduce((previous, current) => previous.concat(current.roles), [])
      .some((ro) => roles.includes(ro));
  }

  public selectHasRoles(namespaceId: string, roles: IAuthorization.Role[], userId: string) {
    return this.selectMany().pipe(
      map((as) => as.filter((a) => this.filterUserAuthorizations(a, namespaceId, userId))),
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
