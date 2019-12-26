import { Title } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';
import { LoginService } from '@tenlastic/ng-http';

import { CrudSnackbarService } from './core/services';
import { TITLE } from './shared/constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  constructor(
    private loginService: LoginService,
    private crudSnackbarService: CrudSnackbarService,
    private identityService: IdentityService,
    private router: Router,
    private titleService: Title,
  ) {
    this.loginService.onLogout.subscribe(this.logOut.bind(this));

    this.titleService.setTitle(`${TITLE}`);
  }

  private logOut() {
    this.router.navigateByUrl('/login');
  }
}
