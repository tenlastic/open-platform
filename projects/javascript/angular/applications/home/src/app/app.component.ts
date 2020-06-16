import { Title } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {
  Connection,
  ConnectionService,
  GameInvitation,
  GameInvitationService,
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
    private gameInvitationService: GameInvitationService,
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
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE}`);

    // Navigate to login page on logout.
    this.loginService.onLogout.subscribe(() => this.navigateToLogin());

    // Handle websockets when logging in and out.
    this.loginService.onLogin.subscribe(() => this.watch());
    this.loginService.onLogout.subscribe(() => this.socketService.closeAll());

    // Handle websockets when access token is set.
    this.identityService.OnAccessTokenSet.subscribe(() => this.watch());

    // Connect to websockets.
    this.watch();

    // Load previous url if set.
    const url = localStorage.getItem('url');
    if (url) {
      this.router.navigateByUrl(url);
    }

    // Remember url when changing pages.
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        localStorage.setItem('url', event.url);
      }
    });
  }

  public navigateToLogin() {
    this.router.navigateByUrl('/authentication/log-in');
  }

  private watch() {
    this.socketService.closeAll();

    this.socketService.watch(Connection, this.connectionService, {});
    this.socketService.watch(GameInvitation, this.gameInvitationService, {});
    this.socketService.watch(GameServer, this.gameServerService, {});
    this.socketService.watch(Group, this.groupService, {});
    this.socketService.watch(GroupInvitation, this.groupInvitationService, {});
    this.socketService.watch(Message, this.messageService, {});
    this.socketService.watch(Release, this.releaseService, {});
  }
}
