import { Title } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  Connection,
  ConnectionService,
  GameServer,
  GameServerService,
  Group,
  GroupInvitation,
  GroupInvitationService,
  GroupService,
  LoginService,
  Message,
  MessageService,
  Release,
  ReleaseService,
} from '@tenlastic/ng-http';

import {
  BackgroundService,
  CrudSnackbarService,
  IdentityService,
  SocketService,
} from './core/services';
import { TITLE } from './shared/constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  constructor(
    public backgroundService: BackgroundService,
    private connectionService: ConnectionService,
    private crudSnackbarService: CrudSnackbarService,
    private gameServerService: GameServerService,
    private groupService: GroupService,
    private groupInvitationService: GroupInvitationService,
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
    this.identityService.OnAccessTokenSet.subscribe(() => this.watch());
  }

  public navigateToLogin() {
    this.router.navigateByUrl('/authentication/log-in');
  }

  private watch() {
    this.socketService.closeAll();

    this.socketService.watch(Connection, this.connectionService, {});
    this.socketService.watch(GameServer, this.gameServerService, {});
    this.socketService.watch(Group, this.groupService, {});
    this.socketService.watch(GroupInvitation, this.groupInvitationService, {});
    this.socketService.watch(Message, this.messageService, {});
    this.socketService.watch(Release, this.releaseService, {});
  }
}
