import { Component, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import { ILogIn, LoginFormComponent } from '@tenlastic/ng-component-library';
import { LoginService } from '@tenlastic/ng-http';

import { TITLE } from '../../../../shared/constants';

@Component({
  templateUrl: 'login-page.component.html',
  styleUrls: ['./login-page.component.scss'],
})
export class LoginPageComponent implements OnInit {
  @ViewChild(LoginFormComponent, { static: false })
  public loginForm: LoginFormComponent;

  public disableLogin: boolean;
  public hasErrors = false;
  public isLoggingIn = false;
  public loadingMessage: string;

  constructor(
    private identityService: IdentityService,
    private loginService: LoginService,
    private router: Router,
    private titleService: Title,
  ) {
    this.titleService.setTitle(`${TITLE} | Log In`);
  }

  public ngOnInit() {
    if (this.identityService.refreshToken) {
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

  private logIn() {
    this.router.navigateByUrl('/');
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
