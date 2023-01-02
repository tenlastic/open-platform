import { DOCUMENT } from '@angular/common';
import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService, TokenService } from '@tenlastic/http';

@Component({
  templateUrl: 'logout-page.component.html',
  styleUrls: ['./logout-page.component.scss'],
})
export class LogoutPageComponent implements OnInit {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private activatedRoute: ActivatedRoute,
    private loginService: LoginService,
    private router: Router,
    private tokenService: TokenService,
  ) {}

  public ngOnInit() {
    this.logOut();
  }

  private async logOut() {
    this.tokenService.clear();
    await this.loginService.delete();

    const { snapshot } = this.activatedRoute;
    if (snapshot.queryParamMap.has('redirectUrl')) {
      this.document.location.href = snapshot.queryParamMap.get('redirectUrl');
    } else {
      this.router.navigateByUrl('/authentication/log-in');
    }
  }
}
