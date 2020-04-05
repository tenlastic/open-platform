import { Injectable } from '@angular/core';

import { Environment } from './environment.service';

@Injectable()
export class EnvironmentServiceMock implements Environment {
  public articleApiBaseUrl = 'http://localhost:3004/articles';
  public connectionApiBaseUrl = 'http://localhost:3002/connections';
  public databaseApiBaseUrl = 'http://localhost:3002/databases';
  public friendApiBaseUrl = 'http://localhost:3006/friends';
  public gameApiBaseUrl = 'http://loclahost:3003/games';
  public gameServerApiBaseUrl = 'http://loclahost:3007/games';
  public ignorationApiBaseUrl = 'http://localhost:3006/ignorations';
  public loginApiBaseUrl = 'http://localhost:3000/logins';
  public messageApiBaseUrl = 'http://localhost:3006/messages';
  public namespaceApiBaseUrl = 'http://localhost:3001/namespaces';
  public passwordResetApiBaseUrl = 'http://localhost:3000/password-resets';
  public releaseApiBaseUrl = 'http://localhost:3004/releases';
  public userApiBaseUrl = 'http://localhost:3000/users';
}
