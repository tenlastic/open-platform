import { BaseModel } from './base';

export class RefreshTokenModel extends BaseModel {
  public description: string;
  public expiresAt: Date;
  public userId: string;

  constructor(parameters?: Partial<RefreshTokenModel>) {
    super(parameters);

    this.expiresAt = this.expiresAt ? new Date(this.expiresAt) : null;
  }
}
