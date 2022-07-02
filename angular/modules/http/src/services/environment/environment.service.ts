import { Inject, Injectable, InjectionToken } from '@angular/core';

export interface Environment {
  articleApiBaseUrl: string;
  buildApiBaseUrl: string;
  collectionApiBaseUrl: string;
  friendApiBaseUrl: string;
  gameApiBaseUrl: string;
  gameAuthorizationApiBaseUrl: string;
  gameServerApiBaseUrl: string;
  groupApiBaseUrl: string;
  groupInvitationApiBaseUrl: string;
  ignorationApiBaseUrl: string;
  loginApiBaseUrl: string;
  matchApiBaseUrl: string;
  messageApiBaseUrl: string;
  namespaceApiBaseUrl: string;
  passwordResetApiBaseUrl: string;
  queueApiBaseUrl: string;
  refreshTokenApiBaseUrl: string;
  userApiBaseUrl: string;
  webSocketApiBaseUrl: string;
  workflowApiBaseUrl: string;
}

export const EnvironmentServiceConfig = new InjectionToken<Environment>('EnvironmentServiceConfig');

@Injectable({ providedIn: 'root' })
export class EnvironmentService implements Environment {
  public articleApiBaseUrl: string;
  public buildApiBaseUrl: string;
  public collectionApiBaseUrl: string;
  public friendApiBaseUrl: string;
  public gameApiBaseUrl: string;
  public gameAuthorizationApiBaseUrl: string;
  public gameServerApiBaseUrl: string;
  public groupApiBaseUrl: string;
  public groupInvitationApiBaseUrl: string;
  public ignorationApiBaseUrl: string;
  public loginApiBaseUrl: string;
  public matchApiBaseUrl: string;
  public messageApiBaseUrl: string;
  public namespaceApiBaseUrl: string;
  public passwordResetApiBaseUrl: string;
  public queueApiBaseUrl: string;
  public queueMemberApiBaseUrl: string;
  public refreshTokenApiBaseUrl: string;
  public userApiBaseUrl: string;
  public webSocketApiBaseUrl: string;
  public workflowApiBaseUrl: string;

  constructor(@Inject(EnvironmentServiceConfig) environment: Environment) {
    Object.assign(this, environment);
  }
}
