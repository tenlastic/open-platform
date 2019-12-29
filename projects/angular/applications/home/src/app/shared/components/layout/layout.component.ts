import { DOCUMENT } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityService } from '@tenlastic/ng-authentication';

import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
})
export class LayoutComponent {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    public identityService: IdentityService,
    public router: Router,
  ) {}

  public logIn() {
    this.document.location.href = environment.loginUrl;
  }

  public logOut() {
    this.document.location.href = environment.logoutUrl;
  }
}
