import { ModuleWithProviders, NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ElectronModule } from '@tenlastic/ng-electron';
import { HttpModule } from '@tenlastic/ng-http';

import { OAuthComponent } from './components/o-auth/o-auth.component';
import {
  EnvironmentService,
  EnvironmentServiceConfig,
} from './services/environment/environment.service';

const components = [OAuthComponent];
const modules = [ElectronModule, HttpModule, RouterModule];

@NgModule({
  declarations: [...components],
  exports: [...components, ...modules],
  imports: [...modules],
})
export class AuthenticationModule {
  public static forRoot(
    config: Partial<EnvironmentService>,
  ): ModuleWithProviders<AuthenticationModule> {
    return {
      ngModule: AuthenticationModule,
      providers: [
        {
          provide: EnvironmentServiceConfig,
          useValue: config,
        },
      ],
    };
  }
}
