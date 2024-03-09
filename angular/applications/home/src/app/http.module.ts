import { NgModule, Provider } from '@angular/core';
import {
  AccessTokenInterceptor,
  ApiService,
  ArticleQuery,
  ArticleService,
  ArticleStore,
  AuthorizationQuery,
  AuthorizationRequestQuery,
  AuthorizationRequestService,
  AuthorizationRequestStore,
  AuthorizationService,
  AuthorizationStore,
  BuildLogQuery,
  BuildLogService,
  BuildLogStore,
  BuildQuery,
  BuildService,
  BuildStore,
  CollectionQuery,
  CollectionService,
  CollectionStore,
  EnvironmentService,
  FriendQuery,
  FriendService,
  FriendStore,
  GameServerLogQuery,
  GameServerLogService,
  GameServerLogStore,
  GameServerQuery,
  GameServerService,
  GameServerStore,
  GameServerTemplateQuery,
  GameServerTemplateService,
  GameServerTemplateStore,
  GroupInvitationQuery,
  GroupInvitationService,
  GroupInvitationStore,
  GroupQuery,
  GroupService,
  GroupStore,
  IgnorationQuery,
  IgnorationService,
  IgnorationStore,
  InvalidRefreshTokenInterceptor,
  LoginService,
  MatchInvitationQuery,
  MatchInvitationService,
  MatchInvitationStore,
  MatchQuery,
  MatchService,
  MatchStore,
  MessageQuery,
  MessageService,
  MessageStore,
  NamespaceLogQuery,
  NamespaceLogService,
  NamespaceLogStore,
  NamespaceQuery,
  NamespaceService,
  NamespaceStore,
  PasswordResetService,
  QueueLogQuery,
  QueueLogService,
  QueueLogStore,
  QueueMemberQuery,
  QueueMemberService,
  QueueMemberStore,
  QueueQuery,
  QueueService,
  QueueStore,
  RecordQuery,
  RecordService,
  RecordStore,
  RefreshTokenQuery,
  RefreshTokenService,
  RefreshTokenStore,
  RetryInterceptor,
  SteamApiKeyQuery,
  SteamApiKeyService,
  SteamApiKeyStore,
  StorefrontQuery,
  StorefrontService,
  StorefrontStore,
  SubscriptionService,
  TokenService,
  UserQuery,
  UserService,
  UserStore,
  WebSocketQuery,
  WebSocketService,
  WebSocketStore,
  WorkflowLogQuery,
  WorkflowLogService,
  WorkflowLogStore,
  WorkflowQuery,
  WorkflowService,
  WorkflowStore,
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
const queries: Provider[] = [
  {
    deps: [ArticleStore],
    provide: ArticleQuery,
    useFactory: (store: ArticleStore) => new ArticleQuery(store),
  },
  {
    deps: [AuthorizationStore],
    provide: AuthorizationQuery,
    useFactory: (store: AuthorizationStore) => new AuthorizationQuery(store),
  },
  {
    deps: [AuthorizationRequestStore],
    provide: AuthorizationRequestQuery,
    useFactory: (store: AuthorizationRequestStore) => new AuthorizationRequestQuery(store),
  },
  {
    deps: [BuildLogStore],
    provide: BuildLogQuery,
    useFactory: (store: BuildLogStore) => new BuildLogQuery(store),
  },
  {
    deps: [BuildStore],
    provide: BuildQuery,
    useFactory: (store: BuildStore) => new BuildQuery(store),
  },
  {
    deps: [CollectionStore],
    provide: CollectionQuery,
    useFactory: (store: CollectionStore) => new CollectionQuery(store),
  },
  {
    deps: [FriendStore, UserQuery],
    provide: FriendQuery,
    useFactory: (store: FriendStore, userQuery: UserQuery) => new FriendQuery(store, userQuery),
  },
  {
    deps: [GameServerLogStore],
    provide: GameServerLogQuery,
    useFactory: (store: GameServerLogStore) => new GameServerLogQuery(store),
  },
  {
    deps: [GameServerStore],
    provide: GameServerQuery,
    useFactory: (store: GameServerStore) => new GameServerQuery(store),
  },
  {
    deps: [GameServerTemplateStore],
    provide: GameServerTemplateQuery,
    useFactory: (store: GameServerTemplateStore) => new GameServerTemplateQuery(store),
  },
  {
    deps: [GroupInvitationStore],
    provide: GroupInvitationQuery,
    useFactory: (store: GroupInvitationStore) => new GroupInvitationQuery(store),
  },
  {
    deps: [GroupStore, UserQuery],
    provide: GroupQuery,
    useFactory: (store: GroupStore) => new GroupQuery(store),
  },
  {
    deps: [IgnorationStore, UserQuery],
    provide: IgnorationQuery,
    useFactory: (store: IgnorationStore, userQuery: UserQuery) =>
      new IgnorationQuery(store, userQuery),
  },
  {
    deps: [MatchInvitationStore],
    provide: MatchInvitationQuery,
    useFactory: (store: MatchInvitationStore) => new MatchInvitationQuery(store),
  },
  {
    deps: [MatchStore],
    provide: MatchQuery,
    useFactory: (store: MatchStore) => new MatchQuery(store),
  },
  {
    deps: [MessageStore],
    provide: MessageQuery,
    useFactory: (store: MessageStore) => new MessageQuery(store),
  },
  {
    deps: [NamespaceLogStore],
    provide: NamespaceLogQuery,
    useFactory: (store: NamespaceLogStore) => new NamespaceLogQuery(store),
  },
  {
    deps: [NamespaceStore],
    provide: NamespaceQuery,
    useFactory: (store: NamespaceStore) => new NamespaceQuery(store),
  },
  {
    deps: [QueueLogStore],
    provide: QueueLogQuery,
    useFactory: (store: QueueLogStore) => new QueueLogQuery(store),
  },
  {
    deps: [QueueMemberStore],
    provide: QueueMemberQuery,
    useFactory: (store: QueueMemberStore) => new QueueMemberQuery(store),
  },
  {
    deps: [QueueStore],
    provide: QueueQuery,
    useFactory: (store: QueueStore) => new QueueQuery(store),
  },
  {
    deps: [RecordStore],
    provide: RecordQuery,
    useFactory: (store: RecordStore) => new RecordQuery(store),
  },
  {
    deps: [RefreshTokenStore],
    provide: RefreshTokenQuery,
    useFactory: (store: RefreshTokenStore) => new RefreshTokenQuery(store),
  },
  {
    deps: [SteamApiKeyStore],
    provide: SteamApiKeyQuery,
    useFactory: (store: SteamApiKeyStore) => new SteamApiKeyQuery(store),
  },
  {
    deps: [StorefrontStore],
    provide: StorefrontQuery,
    useFactory: (store: StorefrontStore) => new StorefrontQuery(store),
  },
  {
    deps: [UserStore],
    provide: UserQuery,
    useFactory: (store: UserStore) => new UserQuery(store),
  },
  {
    deps: [WebSocketStore, UserQuery],
    provide: WebSocketQuery,
    useFactory: (store: WebSocketStore, userQuery: UserQuery) =>
      new WebSocketQuery(store, userQuery),
  },
  {
    deps: [WorkflowLogStore],
    provide: WorkflowLogQuery,
    useFactory: (store: WorkflowLogStore) => new WorkflowLogQuery(store),
  },
  {
    deps: [WorkflowStore],
    provide: WorkflowQuery,
    useFactory: (store: WorkflowStore) => new WorkflowQuery(store),
  },
];
const services: Provider[] = [
  {
    deps: [Axios],
    provide: ApiService,
    useFactory: (axios: Axios) => new ApiService(axios),
  },
  {
    deps: [ApiService, ArticleStore, EnvironmentService],
    provide: ArticleService,
    useFactory: (
      apiService: ApiService,
      store: ArticleStore,
      environmentService: EnvironmentService,
    ) => new ArticleService(apiService, store, environmentService),
  },
  {
    deps: [ApiService, AuthorizationRequestStore, EnvironmentService],
    provide: AuthorizationRequestService,
    useFactory: (
      apiService: ApiService,
      store: AuthorizationRequestStore,
      environmentService: EnvironmentService,
    ) => new AuthorizationRequestService(apiService, store, environmentService),
  },
  {
    deps: [ApiService, AuthorizationStore, EnvironmentService],
    provide: AuthorizationService,
    useFactory: (
      apiService: ApiService,
      store: AuthorizationStore,
      environmentService: EnvironmentService,
    ) => new AuthorizationService(apiService, store, environmentService),
  },
  {
    deps: [ApiService, BuildLogStore, EnvironmentService],
    provide: BuildLogService,
    useFactory: (
      apiService: ApiService,
      store: BuildLogStore,
      environmentService: EnvironmentService,
    ) => new BuildLogService(apiService, store, environmentService),
  },
  {
    deps: [ApiService, BuildStore, EnvironmentService],
    provide: BuildService,
    useFactory: (
      apiService: ApiService,
      store: BuildStore,
      environmentService: EnvironmentService,
    ) => new BuildService(apiService, store, environmentService),
  },
  {
    deps: [ApiService, CollectionStore, EnvironmentService],
    provide: CollectionService,
    useFactory: (
      apiService: ApiService,
      store: CollectionStore,
      environmentService: EnvironmentService,
    ) => new CollectionService(apiService, store, environmentService),
  },
  {
    provide: EnvironmentService,
    useValue: new EnvironmentService({ apiUrl: environment.apiUrl }),
  },
  {
    deps: [ApiService, EnvironmentService, FriendStore],
    provide: FriendService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: FriendStore,
    ) => new FriendService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, GameServerLogStore],
    provide: GameServerLogService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: GameServerLogStore,
    ) => new GameServerLogService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, GameServerStore],
    provide: GameServerService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: GameServerStore,
    ) => new GameServerService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, GameServerTemplateStore],
    provide: GameServerTemplateService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: GameServerTemplateStore,
    ) => new GameServerTemplateService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, GroupInvitationStore],
    provide: GroupInvitationService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: GroupInvitationStore,
    ) => new GroupInvitationService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, GroupStore],
    provide: GroupService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: GroupStore,
    ) => new GroupService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, IgnorationStore],
    provide: IgnorationService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: IgnorationStore,
    ) => new IgnorationService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: LoginService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new LoginService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService, MatchInvitationStore],
    provide: MatchInvitationService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: MatchInvitationStore,
    ) => new MatchInvitationService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, MatchStore],
    provide: MatchService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: MatchStore,
    ) => new MatchService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, MessageStore],
    provide: MessageService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: MessageStore,
    ) => new MessageService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, NamespaceLogStore],
    provide: NamespaceLogService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: NamespaceLogStore,
    ) => new NamespaceLogService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, NamespaceStore],
    provide: NamespaceService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: NamespaceStore,
    ) => new NamespaceService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, QueueLogStore],
    provide: QueueLogService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: QueueLogStore,
    ) => new QueueLogService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, QueueMemberStore, WebSocketService],
    provide: QueueMemberService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: QueueMemberStore,
      webSocketService: WebSocketService,
    ) => new QueueMemberService(apiService, environmentService, store, webSocketService),
  },
  {
    deps: [ApiService, EnvironmentService, QueueStore],
    provide: QueueService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: QueueStore,
    ) => new QueueService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: PasswordResetService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new PasswordResetService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService, RecordStore],
    provide: RecordService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: RecordStore,
    ) => new RecordService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, RefreshTokenStore],
    provide: RefreshTokenService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: RefreshTokenStore,
    ) => new RefreshTokenService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, SteamApiKeyStore],
    provide: SteamApiKeyService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: SteamApiKeyStore,
    ) => new SteamApiKeyService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, StorefrontStore],
    provide: StorefrontService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: StorefrontStore,
    ) => new StorefrontService(apiService, environmentService, store),
  },
  {
    deps: [WebSocketService],
    provide: SubscriptionService,
    useFactory: (webSocketService: WebSocketService) => new SubscriptionService(webSocketService),
  },
  {
    deps: [LoginService],
    provide: TokenService,
    useFactory: (loginService: LoginService) => new TokenService(localStorage, loginService),
  },
  {
    deps: [ApiService, EnvironmentService, UserStore],
    provide: UserService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: UserStore,
    ) => new UserService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, WebSocketStore],
    provide: WebSocketService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: WebSocketStore,
    ) => new WebSocketService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, WorkflowLogStore],
    provide: WorkflowLogService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: WorkflowLogStore,
    ) => new WorkflowLogService(apiService, environmentService, store),
  },
  {
    deps: [ApiService, EnvironmentService, WorkflowStore],
    provide: WorkflowService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: WorkflowStore,
    ) => new WorkflowService(apiService, environmentService, store),
  },
];
const stores: Provider[] = [
  { provide: ArticleStore, useValue: new ArticleStore() },
  { provide: AuthorizationRequestStore, useValue: new AuthorizationRequestStore() },
  { provide: AuthorizationStore, useValue: new AuthorizationStore() },
  { provide: BuildLogStore, useValue: new BuildLogStore() },
  { provide: BuildStore, useValue: new BuildStore() },
  { provide: CollectionStore, useValue: new CollectionStore() },
  { provide: FriendStore, useValue: new FriendStore() },
  { provide: GameServerLogStore, useValue: new GameServerLogStore() },
  { provide: GameServerStore, useValue: new GameServerStore() },
  { provide: GameServerTemplateStore, useValue: new GameServerTemplateStore() },
  { provide: GroupInvitationStore, useValue: new GroupInvitationStore() },
  { provide: GroupStore, useValue: new GroupStore() },
  { provide: IgnorationStore, useValue: new IgnorationStore() },
  { provide: MatchInvitationStore, useValue: new MatchInvitationStore() },
  { provide: MatchStore, useValue: new MatchStore() },
  { provide: MessageStore, useValue: new MessageStore() },
  { provide: NamespaceLogStore, useValue: new NamespaceLogStore() },
  { provide: NamespaceStore, useValue: new NamespaceStore() },
  { provide: QueueLogStore, useValue: new QueueLogStore() },
  { provide: QueueMemberStore, useValue: new QueueMemberStore() },
  { provide: QueueStore, useValue: new QueueStore() },
  { provide: RecordStore, useValue: new RecordStore() },
  { provide: RefreshTokenStore, useValue: new RefreshTokenStore() },
  { provide: SteamApiKeyStore, useValue: new SteamApiKeyStore() },
  { provide: StorefrontStore, useValue: new StorefrontStore() },
  { provide: UserStore, useValue: new UserStore() },
  { provide: WebSocketStore, useValue: new WebSocketStore() },
  { provide: WorkflowLogStore, useValue: new WorkflowLogStore() },
  { provide: WorkflowStore, useValue: new WorkflowStore() },
];

@NgModule({
  providers: [
    { provide: Axios, useValue: new Axios({}) },
    ...interceptors,
    ...queries,
    ...services,
    ...stores,
  ],
})
export class HttpModule {
  constructor(
    private accessTokenInterceptor: AccessTokenInterceptor,
    private invalidRefreshTokenInterceptor: InvalidRefreshTokenInterceptor,
    private retryInterceptor: RetryInterceptor,
  ) {}
}
