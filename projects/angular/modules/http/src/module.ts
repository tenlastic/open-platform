import { ModuleWithProviders, NgModule } from '@angular/core';

import {
  EnvironmentService,
  EnvironmentServiceConfig,
} from './services/environment/environment.service';

@NgModule()
export class HttpModule {
  public static forRoot(config: Partial<EnvironmentService>): ModuleWithProviders<HttpModule> {
    return {
      ngModule: HttpModule,
      providers: [
        {
          provide: EnvironmentServiceConfig,
          useValue: config,
        },
      ],
    };
  }
}
