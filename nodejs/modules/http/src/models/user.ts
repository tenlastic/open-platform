import { BaseModel } from './base';

export class UserModel extends BaseModel {
  public email?: string;
  public password?: string;
  public steamId?: string;
  public steamPersonaName?: string;
  public username?: string;

  constructor(parameters?: Partial<UserModel>) {
    super(parameters);
  }

  public get displayName() {
    if (this.username) {
      return this.username;
    }

    if (this.steamPersonaName) {
      return `Steam: ${this.steamPersonaName}`;
    }

    if (this.steamId) {
      return `Steam ID: ${this.steamId}`;
    }

    return 'Unknown';
  }
}
