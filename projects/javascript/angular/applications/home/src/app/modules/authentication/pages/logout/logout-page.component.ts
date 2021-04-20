import { DOCUMENT } from '@angular/common';
import { Component, OnInit, Inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '@tenlastic/ng-http';

import { IdentityService } from '../../../../core/services';
import { TITLE } from '../../../../shared/constants';

@Component({
  templateUrl: 'logout-page.component.html',
  styleUrls: ['./logout-page.component.scss'],
})
export class LogoutPageComponent implements OnInit {
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
    this.logOut();
  }

  private async logOut() {
    this.identityService.clear();
    await this.loginService.delete();

    const { snapshot } = this.activatedRoute;
    if (snapshot.queryParamMap.has('redirectUrl')) {
      this.document.location.href = snapshot.queryParamMap.get('redirectUrl');
    } else {
      this.router.navigateByUrl('/authentication/log-in');
    }
  }
}
