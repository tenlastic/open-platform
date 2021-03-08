import { Title } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {
  ArticleQuery,
  Build,
  BuildQuery,
  BuildService,
  GameInvitation,
  GameInvitationQuery,
  GameInvitationService,
  GameQuery,
  GameServer,
  GameServerQuery,
  GameServerService,
  GameService,
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
  UserQuery,
  UserService,
  WebSocket,
  WebSocketService,
  Workflow,
  WorkflowService,
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
    private articleQuery: ArticleQuery,
    public backgroundService: BackgroundService,
    private buildQuery: BuildQuery,
    private buildService: BuildService,
    private electronService: ElectronService,
    private gameInvitationQuery: GameInvitationQuery,
    private gameInvitationService: GameInvitationService,
    private gameQuery: GameQuery,
    private gameServerQuery: GameServerQuery,
    private gameServerService: GameServerService,
    private gameService: GameService,
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
    private userQuery: UserQuery,
    private userService: UserService,
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

    this.fetchMissingRecords();
  }

  public fetchMissingRecords() {
    this.articleQuery.selectAll().subscribe(records => {
      const ids = records.map(r => r.gameId).filter(gameId => !this.gameQuery.hasEntity(gameId));
      if (ids.length > 0) {
        this.gameService.find({ where: { _id: { $in: ids } } });
      }
    });
    this.buildQuery.selectAll().subscribe(records => {
      const ids = records.map(f => f.gameId).filter(gameId => !this.gameQuery.hasEntity(gameId));
      if (ids.length > 0) {
        this.gameService.find({ where: { _id: { $in: ids } } });
      }
    });
    this.gameInvitationQuery.selectAll().subscribe(records => {
      const ids = records.map(f => f.gameId).filter(gameId => !this.gameQuery.hasEntity(gameId));
      if (ids.length > 0) {
        this.gameService.find({ where: { _id: { $in: ids } } });
      }
    });
    this.gameInvitationQuery.selectAll().subscribe(records => {
      const ids = records.map(f => f.userId).filter(userId => !this.userQuery.hasEntity(userId));
      if (ids.length > 0) {
        this.userService.find({ where: { _id: { $in: ids } } });
      }
    });
    this.gameServerQuery.selectAll().subscribe(records => {
      const ids = records.map(f => f.gameId).filter(gameId => !this.gameQuery.hasEntity(gameId));
      if (ids.length > 0) {
        this.gameService.find({ where: { _id: { $in: ids } } });
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
