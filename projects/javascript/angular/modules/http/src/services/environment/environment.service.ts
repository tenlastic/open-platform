import { Inject, Injectable, InjectionToken } from '@angular/core';

export interface Environment {
  articleApiBaseUrl: string;
  connectionApiBaseUrl: string;
  databaseApiBaseUrl: string;
  friendApiBaseUrl: string;
  gameApiBaseUrl: string;
  gameInvitationApiBaseUrl: string;
  gameServerApiBaseUrl: string;
  groupApiBaseUrl: string;
  groupInvitationApiBaseUrl: string;
  ignorationApiBaseUrl: string;
  logApiBaseUrl: string;
  loginApiBaseUrl: string;
  messageApiBaseUrl: string;
  namespaceApiBaseUrl: string;
  passwordResetApiBaseUrl: string;
  queueApiBaseUrl: string;
  refreshTokenApiBaseUrl: string;
  releaseApiBaseUrl: string;
  userApiBaseUrl: string;
}

export const EnvironmentServiceConfig = new InjectionToken<Environment>('EnvironmentServiceConfig');

@Injectable({ providedIn: 'root' })
export class EnvironmentService implements Environment {
  public articleApiBaseUrl: string;
  public connectionApiBaseUrl: string;
  public databaseApiBaseUrl: string;
  public friendApiBaseUrl: string;
  public gameApiBaseUrl: string;
  public gameInvitationApiBaseUrl: string;
  public gameServerApiBaseUrl: string;
  public groupApiBaseUrl: string;
  public groupInvitationApiBaseUrl: string;
  public ignorationApiBaseUrl: string;
  public logApiBaseUrl: string;
  public loginApiBaseUrl: string;
  public messageApiBaseUrl: string;
  public namespaceApiBaseUrl: string;
  public passwordResetApiBaseUrl: string;
  public queueApiBaseUrl: string;
  public queueMemberApiBaseUrl: string;
  public refreshTokenApiBaseUrl: string;
  public releaseApiBaseUrl: string;
  public userApiBaseUrl: string;

  constructor(@Inject(EnvironmentServiceConfig) environment: Environment) {
    Object.assign(this, environment);
  }
}
