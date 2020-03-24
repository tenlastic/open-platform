import { DOCUMENT } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Component, Inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IdentityService, SocketService } from '@tenlastic/ng-authentication';
import { ElectronService } from '@tenlastic/ng-electron';
import {
  Connection,
  ConnectionService,
  LoginService,
  Message,
  MessageService,
  Release,
  ReleaseService,
} from '@tenlastic/ng-http';

import { environment } from '../environments/environment';
import { BackgroundService, CrudSnackbarService } from './core/services';
import { TITLE } from './shared/constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    public backgroundService: BackgroundService,
    private connectionService: ConnectionService,
    private crudSnackbarService: CrudSnackbarService,
    private electronService: ElectronService,
    private loginService: LoginService,
    private messageService: MessageService,
    private identityService: IdentityService,
    private releaseService: ReleaseService,
    private router: Router,
    private socketService: SocketService,
    private titleService: Title,
  ) {
    this.titleService.setTitle(`${TITLE}`);

    this.loginService.onLogin.subscribe(() => this.watch());
    this.loginService.onLogout.subscribe(() => this.socketService.closeAll());

    this.loginService.onLogout.subscribe(() => this.navigateToLogin());
  }

  public ngOnInit() {
    this.watch();
  }

  public navigateToLogin() {
    if (this.electronService.isElectron) {
      this.router.navigateByUrl('/authentication/log-in');
    } else {
      this.document.location.href = environment.loginUrl;
    }
  }

  private watch() {
    this.socketService.watch(Connection, this.connectionService, {});
    this.socketService.watch(Message, this.messageService, {});
    this.socketService.watch(Release, this.releaseService, {});
  }
}
