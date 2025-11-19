import { Component, DOCUMENT, Inject, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import {
  AuthorizationRequestModel,
  AuthorizationRequestService,
  AuthorizationState,
  BaseModel,
  GroupInvitationModel,
  GroupInvitationService,
  GroupModel,
  GroupService,
  GroupState,
  LoginService,
  LoginServiceResponse,
  MatchInvitationModel,
  MatchInvitationService,
  MatchModel,
  MatchService,
  QueueMemberModel,
  QueueMemberService,
  QueueMemberState,
  StorefrontModel,
  StorefrontService,
  SubscriptionService,
  TokenService,
  UserService,
  UserState,
  WebSocketService,
  WebSocketState,
} from '@tenlastic/http';
import { v4 as uuid } from 'uuid';

import { environment } from '../environments/environment';
import { ElectronService, ResetService } from './core/services';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  private subscriptions = [
    {
      Model: AuthorizationRequestModel,
      request: { _id: uuid(), path: '/subscriptions/authorization-requests' },
      service: this.authorizationRequestService,
    },
    {
      Model: GroupModel,
      request: { _id: uuid(), path: '/subscriptions/groups' },
      service: this.groupService,
    },
    {
      Model: GroupInvitationModel,
      request: { _id: uuid(), path: '/subscriptions/group-invitations' },
      service: this.groupInvitationService,
    },
    {
      Model: MatchInvitationModel,
      request: { _id: uuid(), path: '/subscriptions/match-invitations' },
      service: this.matchInvitationService,
    },
    {
      Model: MatchModel,
      request: { _id: uuid(), path: '/subscriptions/matches' },
      service: this.matchService,
    },
    {
      Model: QueueMemberModel,
      request: { _id: uuid(), path: '/subscriptions/queue-members' },
      service: this.queueMemberService,
    },
    {
      Model: StorefrontModel,
      request: { _id: uuid(), path: '/subscriptions/storefronts' },
      service: this.storefrontService,
    },
  ];
  private get webSocket() {
    return this.webSocketService.webSockets.find((ws) => this.webSocketUrl === ws.url);
  }
  private get webSocketUrl() {
    return environment.wssUrl;
  }

  constructor(
    private authorizationState: AuthorizationState,
    private authorizationRequestService: AuthorizationRequestService,
    @Inject(DOCUMENT) private document: Document,
    private electronService: ElectronService,
    private groupInvitationService: GroupInvitationService,
    private groupState: GroupState,
    private groupService: GroupService,
    private loginService: LoginService,
    private matchInvitationService: MatchInvitationService,
    private matchService: MatchService,
    private queueMemberState: QueueMemberState,
    private queueMemberService: QueueMemberService,
    private resetService: ResetService,
    private router: Router,
    private storefrontService: StorefrontService,
    private subscriptionService: SubscriptionService,
    private tokenService: TokenService,
    private userState: UserState,
    private userService: UserService,
    private webSocketState: WebSocketState,
    private webSocketService: WebSocketService,
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
    this.loginService.emitter.on('logout', () => this.webSocketService.close(this.webSocket));

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
      if (!this.document.location.href.includes('?') && url) {
        await this.router.navigateByUrl(url);
      }
    }
  }

  public fetchMissingRecords() {
    this.authorizationState.selectMany().subscribe((records) => {
      const ids = records.map((r) => r.userId).filter((ui) => !this.userState.hasOne(ui));
      return ids.length > 0 ? this.userService.find({ where: { _id: { $in: ids } } }) : null;
    });
    this.groupState.selectMany().subscribe((records) => {
      const ids = records.flatMap((r) => r.userIds).filter((ui) => !this.userState.hasOne(ui));
      return ids.length > 0 ? this.userService.find({ where: { _id: { $in: ids } } }) : null;
    });
    this.queueMemberState.selectMany().subscribe((records) => {
      const ids = records.map((r) => r.userId).filter((ui) => !this.userState.hasOne(ui));
      return ids.length > 0 ? this.userService.find({ where: { _id: { $in: ids } } }) : null;
    });
    this.webSocketState.selectMany().subscribe((records) => {
      const ids = records.map((r) => r.userId).filter((ui) => !this.userState.hasOne(ui));
      return ids.length > 0 ? this.userService.find({ where: { _id: { $in: ids } } }) : null;
    });
  }

  public navigateToLogin() {
    this.router.navigateByUrl('/authentication/log-in');
  }

  private async connectSocket() {
    if (this.webSocket) {
      return;
    }

    return Promise.all([this.webSocketService.connect(this.webSocketUrl), this.subscribe()]);
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
        this.webSocket,
        { acks: true },
      ),
    );

    return Promise.all(promises);
  }
}
