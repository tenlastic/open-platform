import { Title } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {
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
  Queue,
  QueueMember,
  QueueMemberService,
  QueueService,
  Release,
  ReleaseService,
  WebSocket,
  WebSocketService,
} from '@tenlastic/ng-http';

import {
  BackgroundService,
  ElectronService,
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
    private electronService: ElectronService,
    private gameInvitationService: GameInvitationService,
    private gameServerService: GameServerService,
    private groupService: GroupService,
    private groupInvitationService: GroupInvitationService,
    private identityService: IdentityService,
    private loginService: LoginService,
    private messageService: MessageService,
    private queueMemberService: QueueMemberService,
    private queueService: QueueService,
    private releaseService: ReleaseService,
    private router: Router,
    private socketService: SocketService,
    private titleService: Title,
    private webSocketService: WebSocketService,
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
    if (url && this.electronService.isElectron) {
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

    this.socketService.watch(GameInvitation, this.gameInvitationService, {});
    this.socketService.watch(GameServer, this.gameServerService, {});
    this.socketService.watch(Group, this.groupService, {});
    this.socketService.watch(GroupInvitation, this.groupInvitationService, {});
    this.socketService.watch(Message, this.messageService, {});
    this.socketService.watch(QueueMember, this.queueMemberService, {});
    this.socketService.watch(Queue, this.queueService, {});
    this.socketService.watch(Release, this.releaseService, {});
    this.socketService.watch(WebSocket, this.webSocketService, {});
  }
}
