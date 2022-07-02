import { Title } from '@angular/platform-browser';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { resetStores } from '@datorama/akita';
import {
  ArticleQuery,
  Authorization,
  AuthorizationService,
  Build,
  BuildQuery,
  BuildService,
  Collection,
  CollectionService,
  Game,
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
  QueueMemberQuery,
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
import { ElectronService, IdentityService, Socket, SocketService } from './core/services';
import { TITLE } from './shared/constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private socket: Socket;

  @HostListener('window:focus', ['$event'])
  private onFocus(event: any) {
    this.connectSocket();
  }

  constructor(
    private articleQuery: ArticleQuery,
    private authorizationService: AuthorizationService,
    private buildQuery: BuildQuery,
    private buildService: BuildService,
    private collectionService: CollectionService,
    private electronService: ElectronService,
    private gameQuery: GameQuery,
    private gameServerQuery: GameServerQuery,
    private gameServerService: GameServerService,
    private gameService: GameService,
    private groupService: GroupService,
    private groupInvitationService: GroupInvitationService,
    private identityService: IdentityService,
    private loginService: LoginService,
    private messageService: MessageService,
    private queueMemberQuery: QueueMemberQuery,
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

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE}`);

    // Navigate to login page on logout.
    this.loginService.onLogout.subscribe(() => this.navigateToLogin());

    // Handle websockets when logging in and out.
    this.loginService.onLogin.subscribe(() => this.connectSocket());
    this.loginService.onLogout.subscribe(() => this.socket?.close());

    // Handle websockets when access token is set.
    this.identityService.OnAccessTokenSet.subscribe((accessToken) => {
      if (accessToken) {
        this.connectSocket();
      }
    });

    // Connect to websockets.
    try {
      await this.connectSocket();
    } catch {}

    // Load previous url if set.
    const url = localStorage.getItem('url');
    if (url && this.electronService.isElectron) {
      this.router.navigateByUrl(url);
    }

    // Remember url when changing pages.
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        localStorage.setItem('url', event.url);
      }
    });

    // Clear stores on logout.
    this.loginService.onLogout.subscribe(() => resetStores());

    this.fetchMissingRecords();
  }

  public fetchMissingRecords() {
    this.articleQuery.selectAll().subscribe((records) => {
      const ids = records
        .map((r) => r.gameId)
        .filter((gameId) => !this.gameQuery.hasEntity(gameId));
      if (ids.length > 0) {
        this.gameService.find({ where: { _id: { $in: ids } } });
      }
    });
    this.buildQuery.selectAll().subscribe((records) => {
      const ids = records
        .map((r) => r.gameId)
        .filter((gameId) => !this.gameQuery.hasEntity(gameId));
      if (ids.length > 0) {
        this.gameService.find({ where: { _id: { $in: ids } } });
      }
    });
    this.gameServerQuery.selectAll().subscribe((records) => {
      const ids = records
        .map((r) => r.gameId)
        .filter((gameId) => !this.gameQuery.hasEntity(gameId));
      if (ids.length > 0) {
        this.gameService.find({ where: { _id: { $in: ids } } });
      }
    });
    this.gameServerQuery.selectAll().subscribe((records) => {
      const ids = records
        .map((r) => r.queueId)
        .filter((queueId) => !this.queueQuery.hasEntity(queueId));
      if (ids.length > 0) {
        this.queueService.find({ where: { _id: { $in: ids } } });
      }
    });
    this.queueMemberQuery.selectAll().subscribe((records) => {
      const ids = records
        .map((r) => r.userId)
        .filter((userId) => !this.userQuery.hasEntity(userId));
      if (ids.length > 0) {
        this.userService.find({ where: { _id: { $in: ids } } });
      }
    });
  }

  public navigateToLogin() {
    this.router.navigateByUrl('/authentication/log-in');
  }

  private async connectSocket() {
    this.socket = await this.socketService.connect(environment.apiBaseUrl);
    this.socket.addEventListener('open', () => this.subscribe());
  }

  private subscribe() {
    this.socket.subscribe('authorizations', Authorization, this.authorizationService);
    this.socket.subscribe('builds', Build, this.buildService);
    this.socket.subscribe('collections', Collection, this.collectionService);
    this.socket.subscribe('game-servers', GameServer, this.gameServerService);
    this.socket.subscribe('games', Game, this.gameService);
    this.socket.subscribe('groups', Group, this.groupService);
    this.socket.subscribe('group-invitations', GroupInvitation, this.groupInvitationService);
    this.socket.subscribe('messages', Message, this.messageService);
    this.socket.subscribe('queue-members', QueueMember, this.queueMemberService);
    this.socket.subscribe('queues', Queue, this.queueService);
    this.socket.subscribe('workflows', Workflow, this.workflowService);
    this.socket.subscribe('web-sockets', WebSocket, this.webSocketService);
  }
}
