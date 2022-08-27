import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { resetStores } from '@datorama/akita';
import {
  AuthorizationModel,
  AuthorizationQuery,
  AuthorizationService,
  AuthorizationStore,
  BuildModel,
  BuildService,
  BuildStore,
  CollectionModel,
  CollectionService,
  CollectionStore,
  GameServerModel,
  GameServerService,
  GameServerStore,
  GroupInvitationModel,
  GroupInvitationService,
  GroupInvitationStore,
  GroupModel,
  GroupService,
  GroupStore,
  LoginService,
  LoginServiceResponse,
  MessageModel,
  MessageService,
  MessageStore,
  NamespaceModel,
  NamespaceService,
  NamespaceStore,
  QueueMemberModel,
  QueueMemberQuery,
  QueueMemberService,
  QueueMemberStore,
  QueueModel,
  QueueService,
  QueueStore,
  StorefrontModel,
  StorefrontService,
  StorefrontStore,
  StreamService,
  TokenService,
  UserModel,
  UserQuery,
  UserService,
  UserStore,
  WebSocketModel,
  WebSocketQuery,
  WebSocketService,
  WebSocketStore,
  WorkflowModel,
  WorkflowService,
  WorkflowStore,
} from '@tenlastic/http';

import { environment } from '../environments/environment';
import { ElectronService } from './core/services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  @HostListener('window:focus', ['$event'])
  private onFocus(event: any) {
    this.connectSocket();
  }

  constructor(
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private authorizationStore: AuthorizationStore,
    private buildService: BuildService,
    private buildStore: BuildStore,
    private collectionService: CollectionService,
    private collectionStore: CollectionStore,
    private electronService: ElectronService,
    private gameServerService: GameServerService,
    private gameServerStore: GameServerStore,
    private groupInvitationService: GroupInvitationService,
    private groupInvitationStore: GroupInvitationStore,
    private groupService: GroupService,
    private groupStore: GroupStore,
    private loginService: LoginService,
    private messageService: MessageService,
    private messageStore: MessageStore,
    private namespaceService: NamespaceService,
    private namespaceStore: NamespaceStore,
    private queueMemberQuery: QueueMemberQuery,
    private queueMemberService: QueueMemberService,
    private queueMemberStore: QueueMemberStore,
    private queueService: QueueService,
    private queueStore: QueueStore,
    private router: Router,
    private storefrontService: StorefrontService,
    private storefrontStore: StorefrontStore,
    private streamService: StreamService,
    private tokenService: TokenService,
    private userQuery: UserQuery,
    private userService: UserService,
    private userStore: UserStore,
    private webSocketQuery: WebSocketQuery,
    private webSocketService: WebSocketService,
    private webSocketStore: WebSocketStore,
    private workflowService: WorkflowService,
    private workflowStore: WorkflowStore,
  ) {}

  public async ngOnInit() {
    // Navigate to login page on logout.
    this.loginService.emitter.on('logout', () => this.navigateToLogin());

    // Set tokens on login and logout.
    this.loginService.emitter.on('login', (response) => this.setTokens(response));
    this.loginService.emitter.on('logout', () => this.tokenService.clear());
    this.loginService.emitter.on('refresh', (response) => this.setTokens(response));

    // Handle websockets when logging in and out.
    this.loginService.emitter.on('login', () => this.connectSocket());
    this.loginService.emitter.on('logout', () => this.streamService.close(environment.wssUrl));

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
    await this.streamService.connect(environment.wssUrl);
    await this.subscribe();
  }

  private setTokens(response: LoginServiceResponse) {
    this.tokenService.setAccessToken(response.accessToken);
    this.tokenService.setRefreshToken(response.refreshToken);
  }

  private subscribe() {
    return Promise.all([
      this.streamService.subscribe(
        AuthorizationModel,
        { collection: 'authorizations' },
        this.authorizationService,
        this.authorizationStore,
        environment.wssUrl,
      ),
      this.streamService.subscribe(
        BuildModel,
        { collection: 'builds' },
        this.buildService,
        this.buildStore,
        environment.wssUrl,
      ),
      this.streamService.subscribe(
        CollectionModel,
        { collection: 'collections' },
        this.collectionService,
        this.collectionStore,
        environment.wssUrl,
      ),
      this.streamService.subscribe(
        GameServerModel,
        { collection: 'game-servers' },
        this.gameServerService,
        this.gameServerStore,
        environment.wssUrl,
      ),
      this.streamService.subscribe(
        GroupModel,
        { collection: 'groups' },
        this.groupService,
        this.groupStore,
        environment.wssUrl,
      ),
      this.streamService.subscribe(
        GroupInvitationModel,
        { collection: 'group-invitations' },
        this.groupInvitationService,
        this.groupInvitationStore,
        environment.wssUrl,
      ),
      this.streamService.subscribe(
        MessageModel,
        { collection: 'messages' },
        this.messageService,
        this.messageStore,
        environment.wssUrl,
      ),
      this.streamService.subscribe(
        NamespaceModel,
        { collection: 'namespaces' },
        this.namespaceService,
        this.namespaceStore,
        environment.wssUrl,
      ),
      this.streamService.subscribe(
        QueueMemberModel,
        { collection: 'queue-members' },
        this.queueMemberService,
        this.queueMemberStore,
        environment.wssUrl,
      ),
      this.streamService.subscribe(
        QueueModel,
        { collection: 'queues' },
        this.queueService,
        this.queueStore,
        environment.wssUrl,
      ),
      this.streamService.subscribe(
        StorefrontModel,
        { collection: 'storefronts' },
        this.storefrontService,
        this.storefrontStore,
        environment.wssUrl,
      ),
      this.streamService.subscribe(
        UserModel,
        { collection: 'users' },
        this.userService,
        this.userStore,
        environment.wssUrl,
      ),
      this.streamService.subscribe(
        WebSocketModel,
        { collection: 'web-sockets' },
        this.webSocketService,
        this.webSocketStore,
        environment.wssUrl,
      ),
      this.streamService.subscribe(
        WorkflowModel,
        { collection: 'workflows' },
        this.workflowService,
        this.workflowStore,
        environment.wssUrl,
      ),
    ]);
  }
}
