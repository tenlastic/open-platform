import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { resetStores } from '@datorama/akita';
import {
  AuthorizationModel,
  AuthorizationQuery,
  AuthorizationService,
  AuthorizationStore,
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
  QueueMemberQuery,
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

  private subscriptions = [
    {
      Model: AuthorizationModel,
      parameters: { _id: uuid(), collection: 'authorizations' },
      service: this.authorizationService,
      store: this.authorizationStore,
    },
    {
      Model: GroupModel,
      parameters: { _id: uuid(), collection: 'groups' },
      service: this.groupService,
      store: this.groupStore,
    },
    {
      Model: GroupInvitationModel,
      parameters: { _id: uuid(), collection: 'group-invitations' },
      service: this.groupInvitationService,
      store: this.groupInvitationStore,
    },
    {
      Model: MessageModel,
      parameters: { _id: uuid(), collection: 'messages' },
      service: this.messageService,
      store: this.messageStore,
    },
    {
      Model: NamespaceModel,
      parameters: { _id: uuid(), collection: 'namespaces' },
      service: this.namespaceService,
      store: this.namespaceStore,
    },
    {
      Model: UserModel,
      parameters: { _id: uuid(), collection: 'users' },
      service: this.userService,
      store: this.userStore,
    },
    {
      Model: WebSocketModel,
      parameters: { _id: uuid(), collection: 'web-sockets' },
      service: this.webSocketService,
      store: this.webSocketStore,
    },
  ];

  constructor(
    private authorizationQuery: AuthorizationQuery,
    private authorizationService: AuthorizationService,
    private authorizationStore: AuthorizationStore,
    private electronService: ElectronService,
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
    private router: Router,
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
    return Promise.all([this.streamService.connect(environment.wssUrl), this.subscribe()]);
  }

  private setTokens(response: LoginServiceResponse) {
    this.tokenService.setAccessToken(response.accessToken);
    this.tokenService.setRefreshToken(response.refreshToken);
  }

  private subscribe() {
    const promises = this.subscriptions.map((s) =>
      this.streamService.subscribe(s.Model, s.parameters, s.service, s.store, environment.wssUrl),
    );

    return Promise.all(promises);
  }
}
