import { Injectable } from '@angular/core';

import { Environment } from './environment.service';

@Injectable()
export class EnvironmentServiceMock implements Environment {
  public articleApiBaseUrl = 'http://localhost:3004/articles';
  public databaseApiBaseUrl = 'http://localhost:3002/databases';
  public gameApiBaseUrl = 'http://loclahost:3003/games';
  public loginApiBaseUrl = 'http://localhost:3000/logins';
  public namespaceApiBaseUrl = 'http://localhost:3001/namespaces';
  public passwordResetApiBaseUrl = 'http://localhost:3000/password-resets';
  public userApiBaseUrl = 'http://localhost:3000/users';
}
