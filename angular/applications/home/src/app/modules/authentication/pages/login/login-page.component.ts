import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService, TokenService } from '@tenlastic/http';

import { ElectronService } from '../../../../core/services';
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
  public get steamUrl() {
    const base = 'https://steamcommunity.com/openid/login';
    const url = new URL(this.document.location.href);

    const parameters = {
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.mode': 'checkid_setup',
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.realm': `${url.protocol}//${url.host}`,
      'openid.return_to': `${url.protocol}//${url.host}/authentication/log-in`,
    };
    const querystring = new URLSearchParams(parameters).toString();

    return `${base}?${querystring}`;
  }

  private get isOAuth() {
    return this.activatedRoute.snapshot.queryParamMap.has('redirectUrl');
  }

  private get isSteam() {
    const opEndpoint = this.activatedRoute.snapshot.queryParams['openid.op_endpoint'];
    return opEndpoint == 'https://steamcommunity.com/openid/login';
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    @Inject(DOCUMENT) private document: Document,
    private electronService: ElectronService,
    private loginService: LoginService,
    private router: Router,
    private tokenService: TokenService,
  ) {}

  public ngOnInit() {
    if (this.isOAuth && this.tokenService.getRefreshToken()) {
      this.refreshToken();
    }

    if (this.isSteam) {
      this.logInWithSteam();
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
      this.router.navigateByUrl(this.electronService.isElectron ? '/store' : '/');
    }
  }

  private async logInWithSteam() {
    this.loadingMessage = 'Logging in with Steam...';

    const assocHandle = this.activatedRoute.snapshot.queryParams['openid.assoc_handle'];
    const claimedId = this.activatedRoute.snapshot.queryParams['openid.claimed_id'];
    const identity = this.activatedRoute.snapshot.queryParams['openid.identity'];
    const responseNonce = this.activatedRoute.snapshot.queryParams['openid.response_nonce'];
    const returnTo = this.activatedRoute.snapshot.queryParams['openid.return_to'];
    const sig = this.activatedRoute.snapshot.queryParams['openid.sig'];
    const signed = this.activatedRoute.snapshot.queryParams['openid.signed'];

    try {
      await this.loginService.createWithSteam(
        assocHandle,
        claimedId,
        identity,
        responseNonce,
        returnTo,
        sig,
        signed,
      );

      return this.logIn();
    } catch (e) {
      this.loadingMessage = null;
      this.loginForm.error = 'Failed to log in with Steam. Please try again.';
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
