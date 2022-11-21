import { EntityState, EntityStore, QueryEntity, StoreConfig } from '@datorama/akita';

import { AuthorizationRequestModel } from '../models/authorization-request';

export interface AuthorizationRequestState extends EntityState<AuthorizationRequestModel> {}

@StoreConfig({ idKey: '_id', name: 'authorizations', resettable: true })
export class AuthorizationRequestStore extends EntityStore<
  AuthorizationRequestState,
  AuthorizationRequestModel
> {}

export class AuthorizationRequestQuery extends QueryEntity<
  AuthorizationRequestState,
  AuthorizationRequestModel
> {
  constructor(protected store: AuthorizationRequestStore) {
    super(store);
  }
}
