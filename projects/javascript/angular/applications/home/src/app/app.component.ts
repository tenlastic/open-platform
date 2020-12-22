import { Title } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {
  Build,
  BuildService,
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
  Workflow,
  WorkflowService,
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
    private buildService: BuildService,
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
    private workflowService: WorkflowService,
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
    this.loginService.onLogin.subscribe(() => this.socketService.connect());
    this.loginService.onLogout.subscribe(() => this.socketService.close());

    // Handle websockets when access token is set.
    this.identityService.OnAccessTokenSet.subscribe(() => this.socketService.connect());

    // Connect to websockets.
    try {
      this.socketService.OnOpen.subscribe(() => this.subscribe());
      this.socketService.connect();
    } catch {}

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

  private subscribe() {
    this.socketService.subscribe('builds', Build, this.buildService);
    this.socketService.subscribe('game-invitations', GameInvitation, this.gameInvitationService);
    this.socketService.subscribe('game-servers', GameServer, this.gameServerService);
    this.socketService.subscribe('groups', Group, this.groupService);
    this.socketService.subscribe('group-invitations', GroupInvitation, this.groupInvitationService);
    this.socketService.subscribe('messages', Message, this.messageService);
    this.socketService.subscribe('queue-members', QueueMember, this.queueMemberService);
    this.socketService.subscribe('queues', Queue, this.queueService);
    this.socketService.subscribe('workflows', Workflow, this.workflowService);
    this.socketService.subscribe('web-sockets', WebSocket, this.webSocketService);
  }
}
