import { BaseModel } from './base';

export class RefreshTokenModel extends BaseModel {
  public expiresAt: Date;
  public userId: string;

  constructor(parameters?: Partial<RefreshTokenModel>) {
    super(parameters);

    if (parameters?.expiresAt) {
      this.expiresAt = new Date(this.expiresAt);
    }
  }
}
