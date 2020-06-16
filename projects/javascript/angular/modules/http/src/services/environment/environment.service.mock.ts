import { Injectable } from '@angular/core';

import { Environment } from './environment.service';

@Injectable()
export class EnvironmentServiceMock implements Environment {
  public articleApiBaseUrl = 'http://api.localhost/articles';
  public connectionApiBaseUrl = 'http://api.localhost/connections';
  public databaseApiBaseUrl = 'http://api.localhost/databases';
  public friendApiBaseUrl = 'http://api.localhost/friends';
  public gameApiBaseUrl = 'http://api.localhost/games';
  public gameInvitationApiBaseUrl = 'http://api.localhost/game-invitations';
  public gameServerApiBaseUrl = 'http://api.localhost/game-servers';
  public groupApiBaseUrl = 'http://api.localhost/groups';
  public groupInvitationApiBaseUrl = 'http://api.localhost/group-invitations';
  public ignorationApiBaseUrl = 'http://api.localhost/ignorations';
  public loginApiBaseUrl = 'http://api.localhost/logins';
  public messageApiBaseUrl = 'http://api.localhost/messages';
  public namespaceApiBaseUrl = 'http://api.localhost/namespaces';
  public passwordResetApiBaseUrl = 'http://api.localhost/password-resets';
  public refreshTokenApiBaseUrl = 'http://api.localhost/refresh-tokens';
  public releaseApiBaseUrl = 'http://api.localhost/releases';
  public userApiBaseUrl = 'http://api.localhost/users';
}
