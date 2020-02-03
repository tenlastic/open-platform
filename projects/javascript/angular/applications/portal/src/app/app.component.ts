import { Title } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityService, SocketService } from '@tenlastic/ng-authentication';
import { Connection, ConnectionService, LoginService } from '@tenlastic/ng-http';

import { CrudSnackbarService } from './core/services';
import { TITLE } from './shared/constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  constructor(
    private connectionService: ConnectionService,
    private crudSnackbarService: CrudSnackbarService,
    private loginService: LoginService,
    private identityService: IdentityService,
    private router: Router,
    private socketService: SocketService,
    private titleService: Title,
  ) {
    this.titleService.setTitle(`${TITLE}`);

    this.loginService.onLogin.subscribe(() => this.watch());
    this.loginService.onLogout.subscribe(() => this.socketService.closeAll());

    this.loginService.onLogout.subscribe(this.logOut.bind(this));
  }

  public ngOnInit() {
    this.watch();
  }

  private logOut() {
    this.router.navigateByUrl('/');
  }

  private watch() {
    this.socketService.watch(Connection, this.connectionService, {});
  }
}
