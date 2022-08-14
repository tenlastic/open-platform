import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService, TokenService } from '@tenlastic/http';

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

  private get isOAuth() {
    return this.activatedRoute.snapshot.queryParamMap.has('redirectUrl');
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    @Inject(DOCUMENT) private document: Document,
    private loginService: LoginService,
    private router: Router,
    private titleService: Title,
    private tokenService: TokenService,
  ) {
    this.titleService.setTitle(`${TITLE} | Log In`);
  }

  public ngOnInit() {
    if (this.isOAuth && this.tokenService.getRefreshToken()) {
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
    if (this.isOAuth) {
      const accessToken = await this.tokenService.getAccessToken();
      const refreshToken = this.tokenService.getRefreshToken();

      const redirectUrl = this.activatedRoute.snapshot.queryParamMap.get('redirectUrl');
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
      const refreshToken = this.tokenService.getRefreshToken();
      await this.loginService.createWithRefreshToken(refreshToken.value);

      return this.logIn();
    } catch (e) {
      this.loadingMessage = null;
      this.loginForm.error = 'Could not verify existing session. Please log in again.';
    }
  }
}
