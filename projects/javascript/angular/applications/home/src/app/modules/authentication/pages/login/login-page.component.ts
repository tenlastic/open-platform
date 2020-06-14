import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '@tenlastic/ng-http';

import { IdentityService } from '../../../../core/services';
import { TITLE } from '../../../../shared/constants';
import { ILogIn, LoginFormComponent } from '../../components';

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
    private activatedRoute: ActivatedRoute,
    @Inject(DOCUMENT) private document: Document,
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
    const { snapshot } = this.activatedRoute;

    if (snapshot.queryParamMap.has('redirectUrl')) {
      const { accessToken, refreshToken } = this.identityService;

      const redirectUrl = snapshot.queryParamMap.get('redirectUrl');
      const url = new URL(redirectUrl);
      url.searchParams.delete('accessToken');
      url.searchParams.append('accessToken', accessToken);
      url.searchParams.delete('refreshToken');
      url.searchParams.append('refreshToken', refreshToken);

      this.document.location.href = redirectUrl.split('?')[0] + url.search;
    } else {
      this.router.navigateByUrl('/');
    }
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
