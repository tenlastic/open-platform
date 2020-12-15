import { Inject, Injectable, InjectionToken } from '@angular/core';

export interface Environment {
  articleApiBaseUrl: string;
  collectionApiBaseUrl: string;
  friendApiBaseUrl: string;
  gameApiBaseUrl: string;
  gameInvitationApiBaseUrl: string;
  gameServerApiBaseUrl: string;
  groupApiBaseUrl: string;
  groupInvitationApiBaseUrl: string;
  ignorationApiBaseUrl: string;
  loginApiBaseUrl: string;
  matchApiBaseUrl: string;
  messageApiBaseUrl: string;
  namespaceApiBaseUrl: string;
  passwordResetApiBaseUrl: string;
  pipelineApiBaseUrl: string;
  pipelineTemplateApiBaseUrl: string;
  queueApiBaseUrl: string;
  refreshTokenApiBaseUrl: string;
  buildApiBaseUrl: string;
  userApiBaseUrl: string;
  webSocketApiBaseUrl: string;
}

export const EnvironmentServiceConfig = new InjectionToken<Environment>('EnvironmentServiceConfig');

@Injectable({ providedIn: 'root' })
export class EnvironmentService implements Environment {
  public articleApiBaseUrl: string;
  public collectionApiBaseUrl: string;
  public friendApiBaseUrl: string;
  public gameApiBaseUrl: string;
  public gameInvitationApiBaseUrl: string;
  public gameServerApiBaseUrl: string;
  public groupApiBaseUrl: string;
  public groupInvitationApiBaseUrl: string;
  public ignorationApiBaseUrl: string;
  public loginApiBaseUrl: string;
  public matchApiBaseUrl: string;
  public messageApiBaseUrl: string;
  public namespaceApiBaseUrl: string;
  public passwordResetApiBaseUrl: string;
  public pipelineApiBaseUrl: string;
  public pipelineTemplateApiBaseUrl: string;
  public queueApiBaseUrl: string;
  public queueMemberApiBaseUrl: string;
  public refreshTokenApiBaseUrl: string;
  public buildApiBaseUrl: string;
  public userApiBaseUrl: string;
  public webSocketApiBaseUrl: string;

  constructor(@Inject(EnvironmentServiceConfig) environment: Environment) {
    Object.assign(this, environment);
  }
}
