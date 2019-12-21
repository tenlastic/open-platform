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

@Injectable()
export class EnvironmentService implements Environment {
  databaseApiBaseUrl: string;
  loginApiBaseUrl: string;
  namespaceApiBaseUrl: string;
  passwordResetApiBaseUrl: string;
  production: boolean;
  userApiBaseUrl: string;

  constructor(@Inject(EnvironmentServiceConfig) environment: Environment) {
    Object.assign(this, environment);
  }
}
