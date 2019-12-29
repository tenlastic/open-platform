import { ModuleWithProviders, NgModule } from '@angular/core';
import { HttpModule } from '@tenlastic/ng-http';

import {
  EnvironmentService,
  EnvironmentServiceConfig,
} from './services/environment/environment.service';

@NgModule({ imports: [HttpModule] })
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
