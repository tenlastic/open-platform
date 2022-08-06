import * as jwt from 'jsonwebtoken';

import { UserModel } from './models/user';

export interface JwtPayload {
  exp?: number;
  jti?: string;
  user?: UserModel;
}

export class Jwt {
  public get isExpired() {
    return Date.now() >= this.payload.exp * 1000;
  }
  public get payload() {
    return this._payload;
  }
  public get value() {
    return this._value;
  }
  public set value(value: string) {
    this._value = value;
    this._payload = jwt.decode(value) as JwtPayload;
  }

  private _payload: JwtPayload;
  private _value: string;

  constructor(value: string) {
    this.value = value;
  }
}
