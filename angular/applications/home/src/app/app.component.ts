import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import {
  AuthorizationModel,
  AuthorizationQuery,
  AuthorizationRequestModel,
  AuthorizationRequestService,
  AuthorizationRequestStore,
  AuthorizationService,
  AuthorizationStore,
  BaseModel,
  GroupInvitationModel,
  GroupInvitationService,
  GroupInvitationStore,
  GroupModel,
  GroupService,
  GroupStore,
  LoginService,
  LoginServiceResponse,
  MatchInvitationModel,
  MatchInvitationService,
  MatchInvitationStore,
  MatchModel,
  MatchService,
  MatchStore,
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
  StorefrontModel,
  StorefrontService,
  StorefrontStore,
  SubscriptionService,
  TokenService,
  UserModel,
  UserQuery,
  UserService,
  UserStore,
  WebSocketModel,
  WebSocketQuery,
  WebSocketRequest,
  WebSocketService,
  WebSocketStore,
} from '@tenlastic/http';
import { v4 as uuid } from 'uuid';

import { environment } from '../environments/environment';
import { ElectronService, ResetService } from './core/services';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  @HostListener('window:focus', ['$event'])
  private onFocus(event: any) {
    this.connectSocket();
  }

  private subscriptions = [
    {
      Model: AuthorizationModel,
      request: { _id: uuid(), path: '/subscriptions/authorizations' } as WebSocketRequest,
      service: this.authorizationService,
      store: this.authorizationStore,
    },
    {
      Model: AuthorizationRequestModel,
      request: { _id: uuid(), path: '/subscriptions/authorization-requests' } as WebSocketRequest,
      service: this.authorizationRequestService,
      store: this.authorizationRequestStore,
    },
    {
      Model: GroupModel,
      request: { _id: uuid(), path: '/subscriptions/groups' } as WebSocketRequest,
      service: this.groupService,
      store: this.groupStore,
    },
    {
      Model: GroupInvitationModel,
      request: { _id: uuid(), path: '/subscriptions/group-invitations' } as WebSocketRequest,
      service: this.groupInvitationService,
      store: this.groupInvitationStore,
    },
    {
      Model: MatchInvitationModel,
      request: { _id: uuid(), path: '/subscriptions/match-invitations' } as WebSocketRequest,
      service: this.matchInvitationService,
      store: this.matchInvitationStore,
    },
    {
      Model: MatchModel,
      request: { _id: uuid(), path: '/subscriptions/matches' } as WebSocketRequest,
      service: this.matchService,
      store: this.matchStore,
    },
    {
      Model: MessageModel,
      request: { _id: uuid(), path: '/subscriptions/messages' } as WebSocketRequest,
      service: this.messageService,
      store: this.messageStore,
    },
    {
      Model: NamespaceModel,
      request: { _id: uuid(), path: '/subscriptions/namespaces' } as WebSocketRequest,
      service: this.namespaceService,
      store: this.namespaceStore,
    },
    {
      Model: QueueMemberModel,
      request: { _id: uuid(), path: '/subscriptions/queue-members' } as WebSocketRequest,
      service: this.queueMemberService,
      store: this.queueMemberStore,
    },
    {
      Model: StorefrontModel,
      request: { _id: uuid(), path: '/subscriptions/storefronts' } as WebSocketRequest,
      service: this.storefrontService,
      store: this.storefrontStore,
    },
    {
      Model: UserModel,
      request: { _id: uuid(), path: '/subscriptions/users' } as WebSocketRequest,
      service: this.userService,
      store: this.userStore,
    },
    {
      Model: WebSocketModel,
      request: { _id: uuid(), path: '/subscriptions/web-sockets' } as WebSocketRequest,
      service: this.webSocketService,
      store: this.webSocketStore,
    },
  ];

  constructor(
    private authorizationQuery: AuthorizationQuery,
    private authorizationRequestService: AuthorizationRequestService,
    private authorizationRequestStore: AuthorizationRequestStore,
    private authorizationService: AuthorizationService,
    private authorizationStore: AuthorizationStore,
    private electronService: ElectronService,
    private groupInvitationService: GroupInvitationService,
    private groupInvitationStore: GroupInvitationStore,
    private groupService: GroupService,
    private groupStore: GroupStore,
    private loginService: LoginService,
    private matchInvitationService: MatchInvitationService,
    private matchInvitationStore: MatchInvitationStore,
    private matchService: MatchService,
    private matchStore: MatchStore,
    private messageService: MessageService,
    private messageStore: MessageStore,
    private namespaceService: NamespaceService,
    private namespaceStore: NamespaceStore,
    private queueMemberQuery: QueueMemberQuery,
    private queueMemberService: QueueMemberService,
    private queueMemberStore: QueueMemberStore,
    private resetService: ResetService,
    private router: Router,
    private storefrontService: StorefrontService,
    private storefrontStore: StorefrontStore,
    private subscriptionService: SubscriptionService,
    private tokenService: TokenService,
    private userQuery: UserQuery,
    private userService: UserService,
    private userStore: UserStore,
    private webSocketQuery: WebSocketQuery,
    private webSocketService: WebSocketService,
    private webSocketStore: WebSocketStore,
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
    this.loginService.emitter.on('logout', () => this.webSocketService.close(environment.wssUrl));

    // Handle websockets when access token is set.
    this.tokenService.emitter.on('accessToken', (accessToken) => {
      if (accessToken) {
        this.connectSocket();
      }
    });

    // Clear stores on login and logout.
    this.loginService.emitter.on('login', () => this.resetService.reset());
    this.loginService.emitter.on('logout', () => this.resetService.reset());

    this.fetchMissingRecords();

    if (this.electronService.isElectron) {
      // Remember URL when changing pages.
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          localStorage.setItem('url', event.url);
        }
      });

      // Return to the previous URL.
      const url = localStorage.getItem('url');
      if (url) {
        await this.router.navigateByUrl(url);
      }
    }
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
    const accessToken = await this.tokenService.getAccessToken();
    return Promise.all([
      this.webSocketService.connect(accessToken, environment.wssUrl),
      this.subscribe(),
    ]);
  }

  private setTokens(response: LoginServiceResponse) {
    this.tokenService.setAccessToken(response.accessToken);
    this.tokenService.setRefreshToken(response.refreshToken);
  }

  private subscribe() {
    const promises = this.subscriptions.map((s) =>
      this.subscriptionService.subscribe<BaseModel>(
        s.Model,
        { ...s.request },
        s.service,
        s.store,
        environment.wssUrl,
        { acks: true },
      ),
    );

    return Promise.all(promises);
  }
}
