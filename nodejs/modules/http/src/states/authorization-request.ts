import { EntityState, QueryEntity, StoreConfig } from '@datorama/akita';

import { AuthorizationRequestModel } from '../models/authorization-request';
import { BaseStore } from './base';

export interface AuthorizationRequestState extends EntityState<AuthorizationRequestModel> {}

@StoreConfig({ idKey: '_id', deepFreezeFn: (o) => o, name: 'authorizations', resettable: true })
export class AuthorizationRequestStore extends BaseStore<
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
