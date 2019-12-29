import { Inject, Injectable, InjectionToken } from '@angular/core';

export interface Environment {
  loginUrl: string;
  logoutUrl: string;
}

export const EnvironmentServiceConfig = new InjectionToken<Environment>('EnvironmentServiceConfig');

@Injectable({ providedIn: 'root' })
export class EnvironmentService implements Environment {
  public loginUrl: string;
  public logoutUrl: string;

  constructor(@Inject(EnvironmentServiceConfig) environment: Environment) {
    Object.assign(this, environment);
  }
}
