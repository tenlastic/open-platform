import { Inject, Injectable, InjectionToken } from '@angular/core';

export interface Environment {
  articleApiBaseUrl: string;
  databaseApiBaseUrl: string;
  gameApiBaseUrl: string;
  loginApiBaseUrl: string;
  namespaceApiBaseUrl: string;
  passwordResetApiBaseUrl: string;
  releaseApiBaseUrl: string;
  userApiBaseUrl: string;
}

export const EnvironmentServiceConfig = new InjectionToken<Environment>('EnvironmentServiceConfig');

@Injectable({ providedIn: 'root' })
export class EnvironmentService implements Environment {
  public articleApiBaseUrl: string;
  public databaseApiBaseUrl: string;
  public gameApiBaseUrl: string;
  public loginApiBaseUrl: string;
  public namespaceApiBaseUrl: string;
  public passwordResetApiBaseUrl: string;
  public releaseApiBaseUrl: string;
  public userApiBaseUrl: string;

  constructor(@Inject(EnvironmentServiceConfig) environment: Environment) {
    Object.assign(this, environment);
  }
}
