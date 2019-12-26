import { Inject, Injectable, InjectionToken } from '@angular/core';

export interface Environment {
  databaseApiBaseUrl: string;
  loginApiBaseUrl: string;
  namespaceApiBaseUrl: string;
  passwordResetApiBaseUrl: string;
  production: boolean;
  userApiBaseUrl: string;
}

export const EnvironmentServiceConfig = new InjectionToken<Environment>('EnvironmentServiceConfig');

@Injectable({ providedIn: 'root' })
export class EnvironmentService implements Environment {
  public databaseApiBaseUrl: string;
  public loginApiBaseUrl: string;
  public namespaceApiBaseUrl: string;
  public passwordResetApiBaseUrl: string;
  public production: boolean;
  public userApiBaseUrl: string;

  constructor(@Inject(EnvironmentServiceConfig) environment: Environment) {
    Object.assign(this, environment);
  }
}
