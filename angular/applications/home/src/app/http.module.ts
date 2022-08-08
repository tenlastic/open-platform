import { NgModule, Provider } from '@angular/core';
import {
  AccessTokenInterceptor,
  ApiService,
  ArticleQuery,
  ArticleService,
  ArticleStore,
  AuthorizationQuery,
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
  GroupInvitationQuery,
  GroupInvitationService,
  GroupInvitationStore,
  GroupQuery,
  GroupService,
  GroupStore,
  IgnorationQuery,
  IgnorationService,
  IgnorationStore,
  LoginService,
  MessageQuery,
  MessageService,
  MessageStore,
  NamespaceQuery,
  NamespaceService,
  NamespaceStore,
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
  StorefrontQuery,
  StorefrontService,
  StorefrontStore,
  StreamService,
  TokenService,
  UnauthorizedInterceptor,
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
    deps: [Axios, TokenService],
    provide: AccessTokenInterceptor,
    useFactory: (axios: Axios, tokenService: TokenService) =>
      new AccessTokenInterceptor(axios, tokenService),
  },
  {
    deps: [Axios, LoginService],
    provide: UnauthorizedInterceptor,
    useFactory: (axios: Axios, loginService: LoginService) =>
      new UnauthorizedInterceptor(axios, loginService),
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
    deps: [GameServerStore, QueueQuery],
    provide: GameServerQuery,
    useFactory: (queueQuery: QueueQuery, store: GameServerStore) =>
      new GameServerQuery(queueQuery, store),
  },
  {
    deps: [GroupInvitationStore],
    provide: GroupInvitationQuery,
    useFactory: (store: GroupInvitationStore) => new GroupInvitationQuery(store),
  },
  {
    deps: [GroupStore, UserQuery],
    provide: GroupQuery,
    useFactory: (store: GroupStore, userQuery: UserQuery) => new GroupQuery(store, userQuery),
  },
  {
    deps: [IgnorationStore, UserQuery],
    provide: IgnorationQuery,
    useFactory: (store: IgnorationStore, userQuery: UserQuery) =>
      new IgnorationQuery(store, userQuery),
  },
  {
    deps: [MessageStore],
    provide: MessageQuery,
    useFactory: (store: MessageStore) => new MessageQuery(store),
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
    deps: [ApiService, AuthorizationStore, EnvironmentService],
    provide: AuthorizationService,
    useFactory: (
      apiService: ApiService,
      store: AuthorizationStore,
      environmentService: EnvironmentService,
    ) => new AuthorizationService(apiService, store, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService, BuildLogStore],
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
    deps: [ApiService, EnvironmentService, CollectionStore],
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
    deps: [ApiService, EnvironmentService, MessageStore],
    provide: MessageService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: MessageStore,
    ) => new MessageService(apiService, environmentService, store),
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
    deps: [ApiService, EnvironmentService, QueueMemberStore],
    provide: QueueMemberService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: QueueMemberStore,
    ) => new QueueMemberService(apiService, environmentService, store),
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
    deps: [ApiService, EnvironmentService, StorefrontStore],
    provide: StorefrontService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      store: StorefrontStore,
    ) => new StorefrontService(apiService, environmentService, store),
  },
  {
    deps: [TokenService],
    provide: StreamService,
    useFactory: (tokenService: TokenService) => new StreamService(tokenService),
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
  { provide: AuthorizationStore, useValue: new AuthorizationStore() },
  { provide: BuildLogStore, useValue: new BuildLogStore() },
  { provide: BuildStore, useValue: new BuildStore() },
  { provide: CollectionStore, useValue: new CollectionStore() },
  { provide: FriendStore, useValue: new FriendStore() },
  { provide: GameServerLogStore, useValue: new GameServerLogStore() },
  { provide: GameServerStore, useValue: new GameServerStore() },
  { provide: GroupInvitationStore, useValue: new GroupInvitationStore() },
  { provide: GroupStore, useValue: new GroupStore() },
  { provide: IgnorationStore, useValue: new IgnorationStore() },
  { provide: MessageStore, useValue: new MessageStore() },
  { provide: NamespaceStore, useValue: new NamespaceStore() },
  { provide: QueueLogStore, useValue: new QueueLogStore() },
  { provide: QueueMemberStore, useValue: new QueueMemberStore() },
  { provide: QueueStore, useValue: new QueueStore() },
  { provide: RecordStore, useValue: new RecordStore() },
  { provide: RefreshTokenStore, useValue: new RefreshTokenStore() },
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
export class HttpModule {}
