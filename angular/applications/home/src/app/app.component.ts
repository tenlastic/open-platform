import { Title } from '@angular/platform-browser';
import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { resetStores } from '@datorama/akita';
import {
  AuthorizationModel,
  AuthorizationQuery,
  AuthorizationService,
  BuildModel,
  BuildService,
  CollectionModel,
  CollectionService,
  GameServerModel,
  GameServerService,
  GroupModel,
  GroupInvitationModel,
  GroupInvitationService,
  GroupService,
  LoginService,
  MessageModel,
  MessageService,
  QueueModel,
  QueueMemberModel,
  QueueMemberQuery,
  QueueMemberService,
  QueueService,
  StorefrontModel,
  StorefrontService,
  UserQuery,
  UserService,
  WebSocketModel,
  WebSocketQuery,
  WebSocketService,
  WorkflowModel,
  WorkflowService,
  TokenService,
} from '@tenlastic/ng-http';

import { environment } from '../environments/environment';
import { ElectronService, Socket, SocketService } from './core/services';
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
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private buildService: BuildService,
    private collectionService: CollectionService,
    private electronService: ElectronService,
    private gameServerService: GameServerService,
    private groupService: GroupService,
    private groupInvitationService: GroupInvitationService,
    private loginService: LoginService,
    private messageService: MessageService,
    private queueMemberQuery: QueueMemberQuery,
    private queueMemberService: QueueMemberService,
    private queueService: QueueService,
    private router: Router,
    private socketService: SocketService,
    private storefrontService: StorefrontService,
    private titleService: Title,
    private tokenService: TokenService,
    private userQuery: UserQuery,
    private userService: UserService,
    private webSocketQuery: WebSocketQuery,
    private webSocketService: WebSocketService,
    private workflowService: WorkflowService,
  ) {}

  public async ngOnInit() {
    this.titleService.setTitle(`${TITLE}`);

    // Navigate to login page on logout.
    this.loginService.emitter.on('logout', () => this.navigateToLogin());

    // Handle websockets when logging in and out.
    this.loginService.emitter.on('login', () => this.connectSocket());
    this.loginService.emitter.on('logout', () => this.socket?.close());

    // Handle websockets when access token is set.
    this.tokenService.emitter.on('accessToken', (accessToken) => {
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
    this.loginService.emitter.on('logout', () => resetStores());

    this.fetchMissingRecords();
  }

  public fetchMissingRecords() {
    this.authorizationQuery.selectAll().subscribe((records) => {
      const ids = records.map((r) => r.userId).filter((ui) => !this.userQuery.hasEntity(ui));
      return ids.length > 0 ? this.userService.find({ where: { _id: { $in: ids } } }) : null;
    });
    this.queueMemberQuery.selectAll().subscribe((records) => {
      const ids = records.map((r) => r.userId).filter((ui) => !this.userQuery.hasEntity(ui));
      return ids.length > 0 ? this.userService.find({ where: { _id: { $in: ids } } }) : null;
    });
    this.webSocketQuery.selectAll().subscribe((records) => {
      const ids = records.map((r) => r.userId).filter((ui) => !this.userQuery.hasEntity(ui));
      return ids.length > 0 ? this.userService.find({ where: { _id: { $in: ids } } }) : null;
    });
  }

  public navigateToLogin() {
    this.router.navigateByUrl('/authentication/log-in');
  }

  private async connectSocket() {
    this.socket = await this.socketService.connect(environment.wssUrl);
    this.socket.addEventListener('open', () => this.subscribe());
  }

  private subscribe() {
    this.socket.subscribe('authorizations', AuthorizationModel, this.authorizationService);
    this.socket.subscribe('builds', BuildModel, this.buildService);
    this.socket.subscribe('collections', CollectionModel, this.collectionService);
    this.socket.subscribe('game-servers', GameServerModel, this.gameServerService);
    this.socket.subscribe('groups', GroupModel, this.groupService);
    this.socket.subscribe('group-invitations', GroupInvitationModel, this.groupInvitationService);
    this.socket.subscribe('messages', MessageModel, this.messageService);
    this.socket.subscribe('queue-members', QueueMemberModel, this.queueMemberService);
    this.socket.subscribe('queues', QueueModel, this.queueService);
    this.socket.subscribe('storefronts', StorefrontModel, this.storefrontService);
    this.socket.subscribe('workflows', WorkflowModel, this.workflowService);
    this.socket.subscribe('web-sockets', WebSocketModel, this.webSocketService);
  }
}
