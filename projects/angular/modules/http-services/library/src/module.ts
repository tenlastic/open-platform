import { ModuleWithProviders, NgModule } from '@angular/core';

import {
  EnvironmentService,
  EnvironmentServiceConfig,
} from './services/environment/environment.service';

@NgModule()
export class HttpServicesModule {
  public static forRoot(
    config: Partial<EnvironmentService>,
  ): ModuleWithProviders<HttpServicesModule> {
    return {
      ngModule: HttpServicesModule,
      providers: [
        {
          provide: EnvironmentServiceConfig,
          useValue: config,
        },
      ],
    };
  }
}
