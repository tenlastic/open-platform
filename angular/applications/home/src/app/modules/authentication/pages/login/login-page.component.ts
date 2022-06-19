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
  @ViewChild(LoginFormComponent)
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
    if (this.identityService.getRefreshToken()) {
      this.refreshToken();
    }
  }

  public async onLogIn(data: ILogIn) {
    try {
      this.loadingMessage = 'Logging in...';
      await this.loginService.createWithCredentials(data.username, data.password);

      return this.logIn();
    } catch (e) {
      this.loadingMessage = null;
      this.loginForm.error = 'Invalid username or password.';
    }
  }

  private async logIn() {
    const { snapshot } = this.activatedRoute;

    if (snapshot.queryParamMap.has('redirectUrl')) {
      const accessToken = await this.identityService.getAccessToken();
      const refreshToken = this.identityService.getRefreshToken();

      const redirectUrl = snapshot.queryParamMap.get('redirectUrl');
      const url = new URL(redirectUrl);
      url.searchParams.delete('accessToken');
      url.searchParams.append('accessToken', accessToken.value);
      url.searchParams.delete('refreshToken');
      url.searchParams.append('refreshToken', refreshToken.value);

      this.document.location.href = redirectUrl.split('?')[0] + url.search;
    } else {
      this.router.navigateByUrl('/');
    }
  }

  private async refreshToken() {
    this.loadingMessage = 'Logging in...';

    try {
      const refreshToken = this.identityService.getRefreshToken();
      await this.loginService.createWithRefreshToken(refreshToken.value);

      return this.logIn();
    } catch (e) {
      this.loadingMessage = null;
      this.loginForm.error = 'Could not verify existing session. Please log in again.';
    }
  }
}
