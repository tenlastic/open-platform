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
  StreamRequest,
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
      request: { _id: uuid(), path: '/authorizations' } as StreamRequest,
      service: this.authorizationService,
      store: this.authorizationStore,
    },
    {
      Model: AuthorizationRequestModel,
      request: { _id: uuid(), path: '/authorization-requests' } as StreamRequest,
      service: this.authorizationRequestService,
      store: this.authorizationRequestStore,
    },
    {
      Model: GroupModel,
      request: { _id: uuid(), path: '/groups' } as StreamRequest,
      service: this.groupService,
      store: this.groupStore,
    },
    {
      Model: GroupInvitationModel,
      request: { _id: uuid(), path: '/group-invitations' } as StreamRequest,
      service: this.groupInvitationService,
      store: this.groupInvitationStore,
    },
    {
      Model: MatchInvitationModel,
      request: { _id: uuid(), path: '/match-invitations' } as StreamRequest,
      service: this.matchInvitationService,
      store: this.matchInvitationStore,
    },
    {
      Model: MatchModel,
      request: { _id: uuid(), path: '/matches' } as StreamRequest,
      service: this.matchService,
      store: this.matchStore,
    },
    {
      Model: MessageModel,
      request: { _id: uuid(), path: '/messages' } as StreamRequest,
      service: this.messageService,
      store: this.messageStore,
    },
    {
      Model: NamespaceModel,
      request: { _id: uuid(), path: '/namespaces' } as StreamRequest,
      service: this.namespaceService,
      store: this.namespaceStore,
    },
    {
      Model: QueueMemberModel,
      request: { _id: uuid(), path: '/queue-members' } as StreamRequest,
      service: this.queueMemberService,
      store: this.queueMemberStore,
    },
    {
      Model: StorefrontModel,
      request: { _id: uuid(), path: '/storefronts' } as StreamRequest,
      service: this.storefrontService,
      store: this.storefrontStore,
    },
    {
      Model: UserModel,
      request: { _id: uuid(), path: '/users' } as StreamRequest,
      service: this.userService,
      store: this.userStore,
    },
    {
      Model: WebSocketModel,
      request: { _id: uuid(), path: '/web-sockets' } as StreamRequest,
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
    private streamService: StreamService,
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
    this.loginService.emitter.on('logout', () => this.streamService.close(environment.wssUrl));

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
      this.streamService.connect({ accessToken, url: environment.wssUrl }),
      this.subscribe(),
    ]);
  }

  private setTokens(response: LoginServiceResponse) {
    this.tokenService.setAccessToken(response.accessToken);
    this.tokenService.setRefreshToken(response.refreshToken);
  }

  private subscribe() {
    const promises = this.subscriptions.map((s) =>
      this.streamService.subscribe<BaseModel>(
        s.Model,
        { ...s.request },
        s.service,
        s.store,
        environment.wssUrl,
      ),
    );

    return Promise.all(promises);
  }
}
