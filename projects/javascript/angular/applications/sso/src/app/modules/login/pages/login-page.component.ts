import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import {
  ILogIn,
  IOnRegister,
  IPasswordResetRequested,
  IPasswordReset,
  LoginFormComponent,
  RegistrationFormComponent,
  PasswordResetRequestFormComponent,
  PasswordResetFormComponent,
} from '@tenlastic/ng-component-library';
import { LoginService, PasswordResetService, UserService } from '@tenlastic/ng-http';

import { TITLE } from '../../../shared/constants';

enum Action {
  LogIn,
  Register,
  RequestPasswordReset,
  ResetPassword,
}

@Component({
  templateUrl: 'login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent implements OnInit {
  @ViewChild(LoginFormComponent, { static: false })
  public loginForm: LoginFormComponent;
  @ViewChild(RegistrationFormComponent, { static: false })
  public registrationForm: RegistrationFormComponent;
  @ViewChild(PasswordResetRequestFormComponent, { static: false })
  public passwordResetRequestForm: PasswordResetRequestFormComponent;
  @ViewChild(PasswordResetFormComponent, { static: false })
  public passwordResetForm: PasswordResetFormComponent;

  public Action = Action;
  public action = Action.LogIn;
  public disableLogin: boolean;
  public hasErrors = false;
  public isLoggingIn = false;
  public loadingMessage: string;

  private redirectUrl: string;
  private resetHash = '';

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private activatedRoute: ActivatedRoute,
    private identityService: IdentityService,
    private loginService: LoginService,
    private passwordResetService: PasswordResetService,
    private titleService: Title,
    private userService: UserService,
  ) {
    this.titleService.setTitle(`${TITLE} | Login`);
  }

  public ngOnInit() {
    const { snapshot } = this.activatedRoute;

    const accessToken = snapshot.queryParamMap.get('accessToken');
    const refreshToken = snapshot.queryParamMap.get('refreshToken');
    this.redirectUrl = snapshot.queryParamMap.get('redirectUrl') || this.document.location.href;
    this.resetHash = snapshot.params.hash;

    if (accessToken && refreshToken) {
      this.loadingMessage = 'Waiting for external process...';
    } else if (this.resetHash) {
      this.action = Action.ResetPassword;
    } else if (this.identityService.refreshToken) {
      this.refreshToken();
    }
  }

  public async onLogIn(data: ILogIn) {
    try {
      this.loadingMessage = 'Logging in...';
      await this.loginService.createWithCredentials(data.email, data.password);

      this.logIn();
    } catch (e) {
      this.loadingMessage = null;
      this.loginForm.error = 'Invalid email address or password.';
    }
  }

  public async onRegister(data: IOnRegister) {
    try {
      await this.userService.create(data);
    } catch (e) {
      this.registrationForm.error = 'Email address has already been registered.';
    }

    this.onLogIn(data);
  }

  public async onPasswordResetRequested(data: IPasswordResetRequested) {
    try {
      await this.passwordResetService.create(data.email);
      this.passwordResetRequestForm.message = `An email explaining how to reset your password has been sent to ${data.email}.`;
    } catch (e) {
      this.passwordResetRequestForm.error = 'Email address has not been registered yet.';
    }
  }

  public async onPasswordReset(data: IPasswordReset) {
    try {
      await this.passwordResetService.delete(this.resetHash, data.password);
      this.passwordResetForm.message = `Password reset successfully. Please login with your new password.`;
    } catch (e) {
      this.passwordResetForm.error = 'An error occurred resetting your password.';
    }
  }

  public setAction(action: Action) {
    this.action = action;

    switch (this.action) {
      case Action.LogIn:
        this.titleService.setTitle(`${TITLE} | Log In`);
        break;

      case Action.Register:
        this.titleService.setTitle(`${TITLE} | Create Account`);
        break;

      case Action.RequestPasswordReset:
        this.titleService.setTitle(`${TITLE} | Reset Password`);
        break;

      case Action.ResetPassword:
        this.titleService.setTitle(`${TITLE} | Reset Password`);
        break;
    }
  }

  private logIn() {
    const { accessToken, refreshToken } = this.identityService;

    const url = new URL(this.redirectUrl);
    url.searchParams.delete('accessToken');
    url.searchParams.append('accessToken', accessToken);
    url.searchParams.delete('refreshToken');
    url.searchParams.append('refreshToken', refreshToken);

    this.document.location.href = this.redirectUrl.split('?')[0] + url.search;
  }

  private async refreshToken() {
    this.loadingMessage = 'Logging in...';

    try {
      const { refreshToken } = this.identityService;
      await this.loginService.createWithRefreshToken(refreshToken);

      this.logIn();
    } catch (e) {
      this.loadingMessage = null;
      this.loginForm.error = 'Could not verify existing session. Please log in again.';
    }
  }
}
