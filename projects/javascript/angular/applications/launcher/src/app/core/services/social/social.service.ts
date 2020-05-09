import { EventEmitter, Injectable } from '@angular/core';
import { User } from '@tenlastic/ng-http';

@Injectable({ providedIn: 'root' })
export class SocialService {
  public OnUserSet = new EventEmitter<User>();

  public get user() {
    return this._user;
  }
  public set user(value: User) {
    this._user = value;
    this.OnUserSet.emit(value);
  }

  private _user: User;
}
