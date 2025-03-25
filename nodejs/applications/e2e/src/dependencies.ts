import * as injector from '@tenlastic/dependency-injection';
import {
  AccessTokenInterceptor,
  ApiService,
  AuthorizationService,
  AuthorizationStore,
  BuildLogService,
  BuildLogStore,
  BuildService,
  BuildStore,
  CollectionService,
  CollectionStore,
  EnvironmentService,
  GameServerLogService,
  GameServerLogStore,
  GameServerService,
  GameServerStore,
  GameServerTemplateService,
  GameServerTemplateStore,
  GroupInvitationService,
  GroupInvitationStore,
  GroupService,
  GroupStore,
  LoginService,
  MatchService,
  MatchStore,
  NamespaceService,
  NamespaceStore,
  PasswordResetService,
  QueueLogService,
  QueueLogStore,
  QueueMemberService,
  QueueMemberStore,
  QueueService,
  QueueStore,
  RecordService,
  RecordStore,
  RetryInterceptor,
  SubscriptionService,
  TeamService,
  TeamStore,
  TokenService,
  UserService,
  UserStore,
  WebSocketService,
  WebSocketStore,
  WorkflowLogService,
  WorkflowLogStore,
  WorkflowService,
  WorkflowStore,
} from '@tenlastic/http';
import { Axios } from 'axios';

const apiUrl = process.env.E2E_API_URL;

const components: injector.Injection[] = [{ provide: Axios, useValue: new Axios({}) }];

const interceptors: injector.Injection[] = [
  {
    deps: [Axios, TokenService, WebSocketService],
    provide: AccessTokenInterceptor,
    useFactory: (axios: Axios, tokenService: TokenService, webSocketService: WebSocketService) =>
      new AccessTokenInterceptor(axios, tokenService, webSocketService),
  },
  {
    deps: [Axios],
    provide: RetryInterceptor,
    useFactory: (axios: Axios) => new RetryInterceptor(axios),
  },
];

const services: injector.Injection[] = [
  {
    deps: [Axios],
    provide: ApiService,
    useFactory: (axios: Axios) => new ApiService(axios),
  },
  {
    deps: [ApiService, AuthorizationStore, EnvironmentService],
    provide: AuthorizationService,
    useFactory: (
      apiService: ApiService,
      authorizationStore: AuthorizationStore,
      environmentService: EnvironmentService,
    ) => new AuthorizationService(apiService, authorizationStore, environmentService),
  },
  {
    deps: [ApiService, BuildLogStore, EnvironmentService],
    provide: BuildLogService,
    useFactory: (
      apiService: ApiService,
      buildLogStore: BuildLogStore,
      environmentService: EnvironmentService,
    ) => new BuildLogService(apiService, buildLogStore, environmentService),
  },
  {
    deps: [ApiService, BuildStore, EnvironmentService],
    provide: BuildService,
    useFactory: (
      apiService: ApiService,
      buildStore: BuildStore,
      environmentService: EnvironmentService,
    ) => new BuildService(apiService, buildStore, environmentService),
  },
  {
    deps: [ApiService, CollectionStore, EnvironmentService],
    provide: CollectionService,
    useFactory: (
      apiService: ApiService,
      collectionStore: CollectionStore,
      environmentService: EnvironmentService,
    ) => new CollectionService(apiService, collectionStore, environmentService),
  },
  { provide: EnvironmentService, useValue: new EnvironmentService({ apiUrl }) },
  {
    deps: [ApiService, EnvironmentService, GameServerLogStore],
    provide: GameServerLogService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      gameServerLogStore: GameServerLogStore,
    ) => new GameServerLogService(apiService, environmentService, gameServerLogStore),
  },
  {
    deps: [ApiService, EnvironmentService, GameServerStore],
    provide: GameServerService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      gameServerStore: GameServerStore,
    ) => new GameServerService(apiService, environmentService, gameServerStore),
  },
  {
    deps: [ApiService, EnvironmentService, GameServerTemplateStore],
    provide: GameServerTemplateService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      gameServerTemplateStore: GameServerTemplateStore,
    ) => new GameServerTemplateService(apiService, environmentService, gameServerTemplateStore),
  },
  {
    deps: [ApiService, EnvironmentService, GroupInvitationStore],
    provide: GroupInvitationService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      groupInvitationStore: GroupInvitationStore,
    ) => new GroupInvitationService(apiService, environmentService, groupInvitationStore),
  },
  {
    deps: [ApiService, EnvironmentService, GroupStore, WebSocketService],
    provide: GroupService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      groupStore: GroupStore,
      webSocketService: WebSocketService,
    ) => new GroupService(apiService, environmentService, groupStore, webSocketService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: LoginService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new LoginService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService, MatchStore],
    provide: MatchService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      matchStore: MatchStore,
    ) => new MatchService(apiService, environmentService, matchStore),
  },
  {
    deps: [ApiService, EnvironmentService, NamespaceStore],
    provide: NamespaceService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      namespaceStore: NamespaceStore,
    ) => new NamespaceService(apiService, environmentService, namespaceStore),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: PasswordResetService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new PasswordResetService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService, QueueLogStore],
    provide: QueueLogService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      queueLogStore: QueueLogStore,
    ) => new QueueLogService(apiService, environmentService, queueLogStore),
  },
  {
    deps: [ApiService, EnvironmentService, QueueMemberStore, WebSocketService],
    provide: QueueMemberService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      queueMemberStore: QueueMemberStore,
      webSocketService: WebSocketService,
    ) => new QueueMemberService(apiService, environmentService, queueMemberStore, webSocketService),
  },
  {
    deps: [ApiService, EnvironmentService, QueueStore],
    provide: QueueService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      queueStore: QueueStore,
    ) => new QueueService(apiService, environmentService, queueStore),
  },
  {
    deps: [ApiService, EnvironmentService, RecordStore],
    provide: RecordService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      recordStore: RecordStore,
    ) => new RecordService(apiService, environmentService, recordStore),
  },
  {
    deps: [WebSocketService],
    provide: SubscriptionService,
    useFactory: (webSocketService: WebSocketService) => new SubscriptionService(webSocketService),
  },
  {
    deps: [ApiService, EnvironmentService, TeamStore],
    provide: TeamService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      teamStore: TeamStore,
    ) => new TeamService(apiService, environmentService, teamStore),
  },
  {
    deps: [LoginService],
    provide: TokenService,
    useFactory: (loginService: LoginService) => new TokenService(null, loginService),
  },
  {
    deps: [ApiService, EnvironmentService, UserStore],
    provide: UserService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      userStore: UserStore,
    ) => new UserService(apiService, environmentService, userStore),
  },
  { provide: WebSocketStore, useValue: new WebSocketStore() },
  {
    deps: [ApiService, EnvironmentService, WebSocketStore],
    provide: WebSocketService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      webSocketStore: WebSocketStore,
    ) => new WebSocketService(apiService, environmentService, webSocketStore),
  },
  {
    deps: [ApiService, EnvironmentService, WorkflowLogStore],
    provide: WorkflowLogService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      workflowLogStore: WorkflowLogStore,
    ) => new WorkflowLogService(apiService, environmentService, workflowLogStore),
  },
  {
    deps: [ApiService, EnvironmentService, WorkflowStore],
    provide: WorkflowService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      workflowStore: WorkflowStore,
    ) => new WorkflowService(apiService, environmentService, workflowStore),
  },
];

const stores: injector.Injection[] = [
  { provide: AuthorizationStore, useValue: new AuthorizationStore() },
  { provide: BuildLogStore, useValue: new BuildLogStore() },
  { provide: BuildStore, useValue: new BuildStore() },
  { provide: CollectionStore, useValue: new CollectionStore() },
  { provide: GameServerLogStore, useValue: new GameServerLogStore() },
  { provide: GameServerStore, useValue: new GameServerStore() },
  { provide: GameServerTemplateStore, useValue: new GameServerTemplateStore() },
  { provide: GroupInvitationStore, useValue: new GroupInvitationStore() },
  { provide: GroupStore, useValue: new GroupStore() },
  { provide: MatchStore, useValue: new MatchStore() },
  { provide: NamespaceStore, useValue: new NamespaceStore() },
  { provide: QueueLogStore, useValue: new QueueLogStore() },
  { provide: QueueMemberStore, useValue: new QueueMemberStore() },
  { provide: QueueStore, useValue: new QueueStore() },
  { provide: RecordStore, useValue: new RecordStore() },
  { provide: TeamStore, useValue: new TeamStore() },
  { provide: UserStore, useValue: new UserStore() },
  { provide: WorkflowLogStore, useValue: new WorkflowLogStore() },
  { provide: WorkflowStore, useValue: new WorkflowStore() },
];

injector.inject([...components, ...interceptors, ...services, ...stores]);

export default {
  apiService: injector.get(ApiService),
  axios: injector.get(Axios),
  authorizationService: injector.get(AuthorizationService),
  authorizationStore: injector.get(AuthorizationStore),
  buildLogService: injector.get(BuildLogService),
  buildService: injector.get(BuildService),
  collectionService: injector.get(CollectionService),
  environmentService: injector.get(EnvironmentService),
  gameServerLogService: injector.get(GameServerLogService),
  gameServerLogStore: injector.get(GameServerLogStore),
  gameServerService: injector.get(GameServerService),
  gameServerStore: injector.get(GameServerStore),
  gameServerTemplateService: injector.get(GameServerTemplateService),
  gameServerTemplateStore: injector.get(GameServerTemplateStore),
  groupInvitationService: injector.get(GroupInvitationService),
  groupInvitationStore: injector.get(GroupInvitationStore),
  groupService: injector.get(GroupService),
  groupStore: injector.get(GroupStore),
  loginService: injector.get(LoginService),
  matchService: injector.get(MatchService),
  matchStore: injector.get(MatchStore),
  namespaceService: injector.get(NamespaceService),
  passwordResetService: injector.get(PasswordResetService),
  queueLogService: injector.get(QueueLogService),
  queueMemberService: injector.get(QueueMemberService),
  queueMemberStore: injector.get(QueueMemberStore),
  queueService: injector.get(QueueService),
  queueStore: injector.get(QueueStore),
  recordService: injector.get(RecordService),
  subscriptionService: injector.get(SubscriptionService),
  teamService: injector.get(TeamService),
  teamStore: injector.get(TeamStore),
  tokenService: injector.get(TokenService),
  userService: injector.get(UserService),
  webSocketService: injector.get(WebSocketService),
  workflowLogService: injector.get(WorkflowLogService),
  workflowService: injector.get(WorkflowService),
};
