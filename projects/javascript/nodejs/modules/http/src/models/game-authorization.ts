import { gameQuery } from '../stores/game';
import { namespaceQuery } from '../stores/namespace';
import { userQuery } from '../stores/user';
import { BaseModel } from './base';

export namespace IGameAuthorization {
  export enum GameAuthorizationStatus {
    Granted = 'granted',
    Pending = 'pending',
    Revoked = 'revoked',
  }
}

export class GameAuthorizationModel extends BaseModel {
  public get game() {
    return gameQuery.getEntity(this.gameId);
  }
  public gameId: string;
  public get namespace() {
    return namespaceQuery.getEntity(this.namespaceId);
  }
  public namespaceId: string;
  public status: IGameAuthorization.GameAuthorizationStatus;
  public get user() {
    return userQuery.getEntity(this.userId);
  }
  public userId: string;

  constructor(parameters: Partial<GameAuthorizationModel> = {}) {
    super(parameters);
  }
}
