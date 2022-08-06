import { Inject, Injectable, InjectionToken } from '@angular/core';

export interface Environment {
  apiUrl: string;
}

export const EnvironmentServiceConfig = new InjectionToken<Environment>('EnvironmentServiceConfig');

export class EnvironmentService implements Environment {
  public apiUrl: string;

  constructor(@Inject(EnvironmentServiceConfig) environment: Environment) {
    Object.assign(this, environment);
  }
}
