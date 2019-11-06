import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule, Optional, SkipSelf } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { MaterialModule } from '@app/material.module';

import { LayoutComponent } from './components';
import { LoginGuard } from './guards';
import {
  ApiService,
  CollectionService,
  DatabaseService,
  LoginService,
  NamespaceService,
  PasswordResetService,
  RecordService,
  UserService,
} from './http';
import { TokenInterceptor, UnauthorizedInterceptor } from './interceptors';
import {
  CollectionFormService,
  CrudSnackbarService,
  IdentityService,
  SelectedNamespaceService,
} from './services';

@NgModule({
  declarations: [LayoutComponent],
  exports: [LayoutComponent, MaterialModule],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    CommonModule,
    HttpClientModule,
    MaterialModule,
    RouterModule,
  ],
  providers: [
    CollectionFormService,
    CrudSnackbarService,
    IdentityService,
    SelectedNamespaceService,

    LoginGuard,

    ApiService,
    CollectionService,
    DatabaseService,
    LoginService,
    NamespaceService,
    PasswordResetService,
    RecordService,
    UserService,

    TokenInterceptor,
    UnauthorizedInterceptor,

    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
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
