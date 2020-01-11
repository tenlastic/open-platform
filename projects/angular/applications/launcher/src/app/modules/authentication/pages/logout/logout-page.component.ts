import { DOCUMENT } from '@angular/common';
import { Component, OnInit, Inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import { LoginService } from '@tenlastic/ng-http';

import { TITLE } from '../../../../shared/constants';

@Component({
  templateUrl: 'logout-page.component.html',
  styleUrls: ['./logout-page.component.scss'],
})
export class LogoutPageComponent implements OnInit {
  private redirectUrl: URL;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private activatedRoute: ActivatedRoute,
    private identityService: IdentityService,
    private loginService: LoginService,
    private router: Router,
    private titleService: Title,
  ) {
    this.titleService.setTitle(`${TITLE} | Logout`);
  }

  public ngOnInit() {
    const { snapshot } = this.activatedRoute;
    this.redirectUrl = new URL(
      snapshot.queryParamMap.get('redirectUrl') || this.document.location.href,
    );

    this.logOut();
  }

  private async logOut() {
    const { refreshToken } = this.identityService;

    if (refreshToken) {
      this.identityService.accessToken = refreshToken;
      await this.loginService.delete();
    }

    this.router.navigateByUrl('/authentication/log-in');
  }
}
