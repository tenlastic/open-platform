import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService, PasswordResetService, UserService } from '@tenlastic/ng-http';

import { TITLE } from '../../../shared/constants';
import {
  ILogIn,
  IOnRegister,
  IPasswordResetRequested,
  IPasswordReset,
  LoginFormComponent,
  RegistrationFormComponent,
  PasswordResetRequestFormComponent,
  PasswordResetFormComponent,
} from '../components';

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
  @ViewChild(LoginFormComponent, { static: true })
  public loginForm: LoginFormComponent;
  @ViewChild(RegistrationFormComponent, { static: true })
  public registrationForm: RegistrationFormComponent;
  @ViewChild(PasswordResetRequestFormComponent, { static: true })
  public passwordResetRequestForm: PasswordResetRequestFormComponent;
  @ViewChild(PasswordResetFormComponent, { static: true })
  public passwordResetForm: PasswordResetFormComponent;

  public Action = Action;
  public action = Action.LogIn;
  public disableLogin: boolean;
  public hasErrors = false;
  public isLoggingIn = false;
  public loadingMessage: string;
  public showSalesforceLogin = false;

  private resetHash = '';

  constructor(
    private activatedRoute: ActivatedRoute,
    private loginService: LoginService,
    private passwordResetService: PasswordResetService,
    private router: Router,
    private titleService: Title,
    private userService: UserService,
  ) {
    this.titleService.setTitle(`${TITLE} | Login`);
  }

  ngOnInit() {
    this.resetHash = this.activatedRoute.snapshot.params.hash;

    if (this.resetHash) {
      this.action = Action.ResetPassword;
    }
  }

  public async onLogIn(data: ILogIn) {
    try {
      this.loadingMessage = 'Logging in...';
      await this.loginService.createWithCredentials(data.email, data.password);
      this.router.navigateByUrl('/namespaces');
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
  }
}
