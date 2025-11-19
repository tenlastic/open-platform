import { Component, DOCUMENT, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '@tenlastic/http';

@Component({
  standalone: false,
  templateUrl: 'logout-page.component.html',
})
export class LogoutPageComponent implements OnInit {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private activatedRoute: ActivatedRoute,
    private loginService: LoginService,
    private router: Router,
  ) {}

  public ngOnInit() {
    this.logOut();
  }

  private async logOut() {
    await this.loginService.delete();

    const { snapshot } = this.activatedRoute;
    if (snapshot.queryParamMap.has('redirectUrl')) {
      this.document.location.href = snapshot.queryParamMap.get('redirectUrl');
    } else {
      this.router.navigateByUrl('/authentication/log-in');
    }
  }
}
