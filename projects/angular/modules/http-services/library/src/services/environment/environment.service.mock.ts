import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EnvironmentServiceMock {
  public databaseApiBaseUrl = 'http://localhost:3002/databases';
  public loginApiBaseUrl = 'http://localhost:3000/logins';
  public namespaceApiBaseUrl = 'http://localhost:3001/namespaces';
  public passwordResetApiBaseUrl = 'http://localhost:3000/password-resets';
  public production = false;
  public userApiBaseUrl = 'http://localhost:3000/users';
}
