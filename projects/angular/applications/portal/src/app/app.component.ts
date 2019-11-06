import { Title } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { LoginService } from '@app/core/http';
import { CrudSnackbarService, IdentityService } from '@app/core/services';
import { TITLE } from '@app/shared/constants';

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
