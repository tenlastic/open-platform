import jwtDecode from 'jwt-decode';

import { UserModel } from './user';

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
    const decodedValue = jwtDecode(value) as any;

    this._payload = {
      exp: decodedValue.exp ? new Date(decodedValue.exp * 1000) : null,
      jti: decodedValue.jti,
      user: decodedValue.user ? new UserModel(decodedValue.user) : null,
    };
    this._value = value;
  }
}
