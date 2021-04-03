import { Title } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {
  ArticleQuery,
  Build,
  BuildQuery,
  BuildService,
  Database,
  DatabaseService,
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
  QueueQuery,
  QueueService,
  UserQuery,
  UserService,
  WebSocket,
  WebSocketService,
  Workflow,
  WorkflowService,
} from '@tenlastic/ng-http';

import { environment } from '../environments/environment';
import {
  BackgroundService,
  ElectronService,
  IdentityService,
  Socket,
  SocketService,
} from './core/services';
import { TITLE } from './shared/constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private socket: Socket;

  constructor(
    private articleQuery: ArticleQuery,
    public backgroundService: BackgroundService,
    private buildQuery: BuildQuery,
    private buildService: BuildService,
    private databaseService: DatabaseService,
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
    private queueQuery: QueueQuery,
    private queueService: QueueService,
    private router: Router,
    private socketService: SocketService,
    private titleService: Title,
    private userQuery: UserQuery,
    private userService: UserService,
    private webSocketService: WebSocketService,
    private workflowService: WorkflowService,
  ) {}

  public ngOnInit() {
    this.titleService.setTitle(`${TITLE}`);

    // Navigate to login page on logout.
    this.loginService.onLogout.subscribe(() => this.navigateToLogin());

    // Handle websockets when logging in and out.
    this.loginService.onLogin.subscribe(() => {
      this.socket = this.socketService.connect(environment.apiBaseUrl);
    });
    this.loginService.onLogout.subscribe(() => this.socket && this.socket.close());

    // Handle websockets when access token is set.
    this.identityService.OnAccessTokenSet.subscribe(() => {
      this.socket = this.socketService.connect(environment.apiBaseUrl);
    });

    // Connect to websockets.
    try {
      this.socketService.OnOpen.subscribe(() => this.subscribe());
      this.socket = this.socketService.connect(environment.apiBaseUrl);
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
      const ids = records.map(r => r.gameId).filter(gameId => !this.gameQuery.hasEntity(gameId));
      if (ids.length > 0) {
        this.gameService.find({ where: { _id: { $in: ids } } });
      }
    });
    this.gameInvitationQuery.selectAll().subscribe(records => {
      const ids = records.map(r => r.gameId).filter(gameId => !this.gameQuery.hasEntity(gameId));
      if (ids.length > 0) {
        this.gameService.find({ where: { _id: { $in: ids } } });
      }
    });
    this.gameInvitationQuery.selectAll().subscribe(records => {
      const ids = records.map(r => r.userId).filter(userId => !this.userQuery.hasEntity(userId));
      if (ids.length > 0) {
        this.userService.find({ where: { _id: { $in: ids } } });
      }
    });
    this.gameServerQuery.selectAll().subscribe(records => {
      const ids = records.map(r => r.gameId).filter(gameId => !this.gameQuery.hasEntity(gameId));
      if (ids.length > 0) {
        this.gameService.find({ where: { _id: { $in: ids } } });
      }
    });
    this.gameServerQuery.selectAll().subscribe(records => {
      const ids = records
        .map(r => r.queueId)
        .filter(queueId => !this.queueQuery.hasEntity(queueId));
      if (ids.length > 0) {
        this.queueService.find({ where: { _id: { $in: ids } } });
      }
    });
  }

  public navigateToLogin() {
    this.router.navigateByUrl('/authentication/log-in');
  }

  private subscribe() {
    this.socket.subscribe('builds', Build, this.buildService);
    this.socket.subscribe('databases', Database, this.databaseService);
    this.socket.subscribe('game-invitations', GameInvitation, this.gameInvitationService);
    this.socket.subscribe('game-servers', GameServer, this.gameServerService);
    this.socket.subscribe('groups', Group, this.groupService);
    this.socket.subscribe('group-invitations', GroupInvitation, this.groupInvitationService);
    this.socket.subscribe('messages', Message, this.messageService);
    this.socket.subscribe('queue-members', QueueMember, this.queueMemberService);
    this.socket.subscribe('queues', Queue, this.queueService);
    this.socket.subscribe('workflows', Workflow, this.workflowService);
    this.socket.subscribe('web-sockets', WebSocket, this.webSocketService);
  }
}
