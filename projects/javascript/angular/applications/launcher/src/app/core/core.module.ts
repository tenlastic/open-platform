import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import {
  RefreshTokenInterceptor,
  TokenInterceptor,
  UnauthorizedInterceptor,
} from '@tenlastic/ng-authentication';

import { MaterialModule } from '../material.module';
import { CrudSnackbarService } from './services';

@NgModule({
  exports: [MaterialModule],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    HttpClientModule,
    MaterialModule,
    RouterModule,
  ],
  providers: [
    CrudSnackbarService,

    {
      provide: HTTP_INTERCEPTORS,
      useClass: RefreshTokenInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: UnauthorizedInterceptor,
      multi: true,
    },
  ],
})
export class CoreModule {
  /* make sure CoreModule is imported only by one NgModule the AppModule */
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import only in AppModule.');
    }
  }
}
