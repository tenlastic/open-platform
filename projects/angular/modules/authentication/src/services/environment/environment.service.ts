import { Inject, Injectable, InjectionToken } from '@angular/core';
import { ElectronService } from '@tenlastic/ng-electron';

export interface Environment {
  loginUrl: string;
  logoutUrl: string;
}

export const EnvironmentServiceConfig = new InjectionToken<Environment>('EnvironmentServiceConfig');

@Injectable({ providedIn: 'root' })
export class EnvironmentService implements Environment {
  public loginUrl: string;
  public logoutUrl: string;

  constructor(
    private electronService: ElectronService,
    @Inject(EnvironmentServiceConfig) environment: Environment,
  ) {
    Object.assign(this, environment);

    if (!electronService.isElectron) {
      return;
    }

    let path = this.electronService.remote.app.getAppPath().replace(/\\/g, '/');
    path = path.substring(0, path.lastIndexOf('/'));

    const redirectUrl = `file:///${path}/angular/index.html#oauth`;
    this.loginUrl += `?redirectUrl=${encodeURIComponent(redirectUrl)}`;
    this.logoutUrl += `?redirectUrl=${encodeURIComponent(redirectUrl)}`;
  }
}
