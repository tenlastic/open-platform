import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';

import { LoginGuard } from './guards/login/login.guard';

import { TokenInterceptor } from './interceptors/token/token.interceptor';
import { UnauthorizedInterceptor } from './interceptors/unauthorized/unauthorized.interceptor';

import { ApiService } from './services/api/api.service';
import { CollectionService } from './services/collection/collection.service';
import { DatabaseService } from './services/database/database.service';
import {
  EnvironmentService,
  EnvironmentServiceConfig,
} from './services/environment/environment.service';
import { IdentityService } from './services/identity/identity.service';
import { LoginService } from './services/login/login.service';
import { NamespaceService } from './services/namespace/namespace.service';
import { PasswordResetService } from './services/password-reset/password-reset.service';
import { RecordService } from './services/record/record.service';
import { UserService } from './services/user/user.service';

@NgModule({
  providers: [
    LoginGuard,

    TokenInterceptor,
    UnauthorizedInterceptor,

    ApiService,
    CollectionService,
    DatabaseService,
    EnvironmentService,
    IdentityService,
    LoginService,
    NamespaceService,
    PasswordResetService,
    RecordService,
    UserService,
  ],
})
export class HttpServicesModule {
  // Make sure HttpServicesModule is imported only by one NgModule: the AppModule.
  constructor(@Optional() @SkipSelf() parentModule: HttpServicesModule) {
    if (parentModule) {
      throw new Error('HttpServicesModule is already loaded. Import only in AppModule.');
    }
  }

  public static forRoot(config: Partial<EnvironmentService>): ModuleWithProviders {
    return {
      ngModule: HttpServicesModule,
      providers: [
        EnvironmentService,
        {
          provide: EnvironmentServiceConfig,
          useValue: config,
        },
      ],
    };
  }
}
