import { Injectable } from '@angular/core';

import { Environment } from './environment.service';

@Injectable()
export class EnvironmentServiceMock implements Environment {
  public articleApiBaseUrl = 'http://api.localhost/articles';
  public collectionApiBaseUrl = 'http://api.localhost/collections';
  public friendApiBaseUrl = 'http://api.localhost/friends';
  public gameApiBaseUrl = 'http://api.localhost/games';
  public authorizationApiBaseUrl = 'http://api.localhost/authorizations';
  public gameServerApiBaseUrl = 'http://api.localhost/game-servers';
  public groupApiBaseUrl = 'http://api.localhost/groups';
  public groupInvitationApiBaseUrl = 'http://api.localhost/group-invitations';
  public ignorationApiBaseUrl = 'http://api.localhost/ignorations';
  public loginApiBaseUrl = 'http://api.localhost/logins';
  public matchApiBaseUrl = 'http://api.localhost/matches';
  public messageApiBaseUrl = 'http://api.localhost/messages';
  public namespaceApiBaseUrl = 'http://api.localhost/namespaces';
  public passwordResetApiBaseUrl = 'http://api.localhost/password-resets';
  public queueApiBaseUrl = 'http://api.localhost/queues';
  public queueMemberApiBaseUrl = 'http://api.localhost/queue-members';
  public refreshTokenApiBaseUrl = 'http://api.localhost/refresh-tokens';
  public buildApiBaseUrl = 'http://api.localhost/builds';
  public userApiBaseUrl = 'http://api.localhost/users';
  public webSocketApiBaseUrl = 'http://api.localhost/web-sockets';
  public workflowApiBaseUrl = 'http://api.localhost/workflows';
}
