import { NgModule, Provider } from '@angular/core';
import {
  AccessTokenInterceptor,
  ApiService,
  ArticleService,
  ArticleState,
  AuthorizationRequestService,
  AuthorizationRequestState,
  AuthorizationService,
  AuthorizationState,
  BuildLogService,
  BuildLogState,
  BuildService,
  BuildState,
  CollectionService,
  CollectionState,
  EnvironmentService,
  GameServerLogService,
  GameServerLogState,
  GameServerService,
  GameServerState,
  GameServerTemplateService,
  GameServerTemplateState,
  GroupInvitationService,
  GroupInvitationState,
  GroupService,
  GroupState,
  InvalidRefreshTokenInterceptor,
  LoginService,
  MatchInvitationService,
  MatchInvitationState,
  MatchService,
  MatchState,
  NamespaceLogService,
  NamespaceLogState,
  NamespaceService,
  NamespaceState,
  PasswordResetService,
  QueueLogService,
  QueueLogState,
  QueueMemberService,
  QueueMemberState,
  QueueService,
  QueueState,
  RecordService,
  RecordState,
  RetryInterceptor,
  SteamIntegrationService,
  SteamIntegrationState,
  StorefrontService,
  StorefrontState,
  SubscriptionService,
  TeamService,
  TeamState,
  TokenService,
  UserService,
  UserState,
  WebSocketService,
  WebSocketState,
  WorkflowLogService,
  WorkflowLogState,
  WorkflowService,
  WorkflowState,
} from '@tenlastic/http';
import { Axios } from 'axios';

import { environment } from '../environments/environment';

const interceptors: Provider[] = [
  {
    deps: [Axios, TokenService, WebSocketService],
    provide: AccessTokenInterceptor,
    useFactory: (axios: Axios, tokenService: TokenService, webSocketService: WebSocketService) =>
      new AccessTokenInterceptor(axios, tokenService, webSocketService),
  },
  {
    deps: [Axios, LoginService],
    provide: InvalidRefreshTokenInterceptor,
    useFactory: (axios: Axios, loginService: LoginService) =>
      new InvalidRefreshTokenInterceptor(axios, loginService),
  },
  {
    deps: [Axios],
    provide: RetryInterceptor,
    useFactory: (axios: Axios) => new RetryInterceptor(axios),
  },
];
const services: Provider[] = [
  {
    deps: [Axios],
    provide: ApiService,
    useFactory: (axios: Axios) => new ApiService(axios),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: ArticleService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new ArticleService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: AuthorizationRequestService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new AuthorizationRequestService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: AuthorizationService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new AuthorizationService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: BuildLogService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new BuildLogService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: BuildService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new BuildService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: CollectionService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new CollectionService(apiService, environmentService),
  },
  {
    provide: EnvironmentService,
    useValue: new EnvironmentService({ apiUrl: environment.apiUrl }),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: GameServerLogService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new GameServerLogService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: GameServerService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new GameServerService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: GameServerTemplateService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new GameServerTemplateService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: GroupInvitationService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new GroupInvitationService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: GroupService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new GroupService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: LoginService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new LoginService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: MatchInvitationService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new MatchInvitationService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: MatchService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new MatchService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: NamespaceLogService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new NamespaceLogService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: NamespaceService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new NamespaceService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: QueueLogService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new QueueLogService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService, WebSocketService],
    provide: QueueMemberService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      webSocketService: WebSocketService,
    ) => new QueueMemberService(apiService, environmentService, webSocketService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: QueueService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new QueueService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: PasswordResetService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new PasswordResetService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: RecordService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new RecordService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: SteamIntegrationService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new SteamIntegrationService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: StorefrontService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new StorefrontService(apiService, environmentService),
  },
  {
    deps: [WebSocketService],
    provide: SubscriptionService,
    useFactory: (webSocketService: WebSocketService) => new SubscriptionService(webSocketService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: TeamService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new TeamService(apiService, environmentService),
  },
  {
    deps: [LoginService],
    provide: TokenService,
    useFactory: (loginService: LoginService) => new TokenService(localStorage, loginService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: UserService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new UserService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: WebSocketService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new WebSocketService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: WorkflowLogService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new WorkflowLogService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: WorkflowService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new WorkflowService(apiService, environmentService),
  },
];
const states: Provider[] = [
  {
    deps: [ArticleService],
    provide: ArticleState,
    useFactory: (service: ArticleService) => new ArticleState(service),
  },
  {
    deps: [AuthorizationService],
    provide: AuthorizationState,
    useFactory: (service: AuthorizationService) => new AuthorizationState(service),
  },
  {
    deps: [AuthorizationRequestService],
    provide: AuthorizationRequestState,
    useFactory: (service: AuthorizationRequestService) => new AuthorizationRequestState(service),
  },
  {
    deps: [BuildLogService],
    provide: BuildLogState,
    useFactory: (service: BuildLogService) => new BuildLogState(service),
  },
  {
    deps: [BuildService],
    provide: BuildState,
    useFactory: (service: BuildService) => new BuildState(service),
  },
  {
    deps: [CollectionService],
    provide: CollectionState,
    useFactory: (service: CollectionService) => new CollectionState(service),
  },
  {
    deps: [GameServerLogService],
    provide: GameServerLogState,
    useFactory: (service: GameServerLogService) => new GameServerLogState(service),
  },
  {
    deps: [GameServerService],
    provide: GameServerState,
    useFactory: (service: GameServerService) => new GameServerState(service),
  },
  {
    deps: [GameServerTemplateService],
    provide: GameServerTemplateState,
    useFactory: (service: GameServerTemplateService) => new GameServerTemplateState(service),
  },
  {
    deps: [GroupInvitationService],
    provide: GroupInvitationState,
    useFactory: (service: GroupInvitationService) => new GroupInvitationState(service),
  },
  {
    deps: [GroupService],
    provide: GroupState,
    useFactory: (service: GroupService) => new GroupState(service),
  },
  {
    deps: [MatchInvitationService],
    provide: MatchInvitationState,
    useFactory: (service: MatchInvitationService) => new MatchInvitationState(service),
  },
  {
    deps: [MatchService],
    provide: MatchState,
    useFactory: (service: MatchService) => new MatchState(service),
  },
  {
    deps: [NamespaceLogService],
    provide: NamespaceLogState,
    useFactory: (service: NamespaceLogService) => new NamespaceLogState(service),
  },
  {
    deps: [NamespaceService],
    provide: NamespaceState,
    useFactory: (service: NamespaceService) => new NamespaceState(service),
  },
  {
    deps: [QueueLogService],
    provide: QueueLogState,
    useFactory: (service: QueueLogService) => new QueueLogState(service),
  },
  {
    deps: [QueueMemberService],
    provide: QueueMemberState,
    useFactory: (service: QueueMemberService) => new QueueMemberState(service),
  },
  {
    deps: [QueueService],
    provide: QueueState,
    useFactory: (service: QueueService) => new QueueState(service),
  },
  {
    deps: [RecordService],
    provide: RecordState,
    useFactory: (service: RecordService) => new RecordState(service),
  },
  {
    deps: [SteamIntegrationService],
    provide: SteamIntegrationState,
    useFactory: (service: SteamIntegrationService) => new SteamIntegrationState(service),
  },
  {
    deps: [StorefrontService],
    provide: StorefrontState,
    useFactory: (service: StorefrontService) => new StorefrontState(service),
  },
  {
    deps: [TeamService],
    provide: TeamState,
    useFactory: (service: TeamService) => new TeamState(service),
  },
  {
    deps: [UserService],
    provide: UserState,
    useFactory: (service: UserService) => new UserState(service),
  },
  {
    deps: [WebSocketService, UserState],
    provide: WebSocketState,
    useFactory: (service: WebSocketService, userState: UserState) => new WebSocketState(service),
  },
  {
    deps: [WorkflowLogService],
    provide: WorkflowLogState,
    useFactory: (service: WorkflowLogService) => new WorkflowLogState(service),
  },
  {
    deps: [WorkflowService],
    provide: WorkflowState,
    useFactory: (service: WorkflowService) => new WorkflowState(service),
  },
];

@NgModule({
  providers: [{ provide: Axios, useValue: new Axios({}) }, ...interceptors, ...states, ...services],
})
export class HttpModule {
  constructor(
    private accessTokenInterceptor: AccessTokenInterceptor,
    private invalidRefreshTokenInterceptor: InvalidRefreshTokenInterceptor,
    private retryInterceptor: RetryInterceptor,
  ) {}
}
