import { Injectable } from '@angular/core';

import { Environment } from './environment.service';

@Injectable()
export class EnvironmentServiceMock implements Environment {
  public databaseApiBaseUrl = 'http://localhost:3002/databases';
  public loginApiBaseUrl = 'http://localhost:3000/logins';
  public namespaceApiBaseUrl = 'http://localhost:3001/namespaces';
  public passwordResetApiBaseUrl = 'http://localhost:3000/password-resets';
  public userApiBaseUrl = 'http://localhost:3000/users';
}
