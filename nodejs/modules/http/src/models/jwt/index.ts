import { UserModel } from '../user';

export interface JwtPayload {
  exp?: Date;
  jti?: string;
  user?: UserModel;
}

export class Jwt {
  public get isExpired() {
    return new Date() > this.payload.exp;
  }
  public get payload() {
    return this._payload;
  }
  public get value() {
    return this._value;
  }

  private _payload: JwtPayload;
  private _value: string;

  constructor(value: string) {
    try {
      const decodedValue = this.getPayload(value);

      this._payload = {
        exp: decodedValue.exp ? new Date(decodedValue.exp * 1000) : null,
        jti: decodedValue.jti,
        user: decodedValue.user ? new UserModel(decodedValue.user) : null,
      };
    } catch (e) {
      throw new Error('Could not decode JWT payload.');
    }

    this._value = value;
  }

  private getPayload(value: string) {
    const splits = value.split('.');

    let json: string;
    try {
      json = atob(splits[1]);
    } catch {
      json = Buffer.from(splits[1], 'base64').toString('utf-8');
    }

    return JSON.parse(json);
  }
}
