import * as injector from '@tenlastic/dependency-injection';
import {
  AccessTokenInterceptor,
  ApiService,
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
  LoginService,
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
  StreamService,
  TokenService,
  UserService,
  UserStore,
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
    deps: [Axios, TokenService],
    provide: AccessTokenInterceptor,
    useFactory: (axios: Axios, tokenService: TokenService) =>
      new AccessTokenInterceptor(axios, tokenService),
  },
];

const services: injector.Injection[] = [
  {
    deps: [Axios],
    provide: ApiService,
    useFactory: (axios: Axios) => new ApiService(axios),
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
    deps: [ApiService, EnvironmentService],
    provide: LoginService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new LoginService(apiService, environmentService),
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
    deps: [ApiService, EnvironmentService, QueueMemberStore, StreamService],
    provide: QueueMemberService,
    useFactory: (
      apiService: ApiService,
      environmentService: EnvironmentService,
      queueMemberStore: QueueMemberStore,
      streamService: StreamService,
    ) => new QueueMemberService(apiService, environmentService, queueMemberStore, streamService),
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
  { provide: StreamService, useFactory: () => new StreamService() },
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
  { provide: BuildLogStore, useValue: new BuildLogStore() },
  { provide: BuildStore, useValue: new BuildStore() },
  { provide: CollectionStore, useValue: new CollectionStore() },
  { provide: GameServerLogStore, useValue: new GameServerLogStore() },
  { provide: GameServerStore, useValue: new GameServerStore() },
  { provide: GameServerTemplateStore, useValue: new GameServerTemplateStore() },
  { provide: NamespaceStore, useValue: new NamespaceStore() },
  { provide: QueueLogStore, useValue: new QueueLogStore() },
  { provide: QueueMemberStore, useValue: new QueueMemberStore() },
  { provide: QueueStore, useValue: new QueueStore() },
  { provide: RecordStore, useValue: new RecordStore() },
  { provide: UserStore, useValue: new UserStore() },
  { provide: WorkflowLogStore, useValue: new WorkflowLogStore() },
  { provide: WorkflowStore, useValue: new WorkflowStore() },
];

injector.inject([...components, ...interceptors, ...services, ...stores]);

export default {
  apiService: injector.get(ApiService),
  axios: injector.get(Axios),
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
  loginService: injector.get(LoginService),
  namespaceService: injector.get(NamespaceService),
  passwordResetService: injector.get(PasswordResetService),
  queueLogService: injector.get(QueueLogService),
  queueMemberService: injector.get(QueueMemberService),
  queueMemberStore: injector.get(QueueMemberStore),
  queueService: injector.get(QueueService),
  queueStore: injector.get(QueueStore),
  recordService: injector.get(RecordService),
  streamService: injector.get(StreamService),
  tokenService: injector.get(TokenService),
  userService: injector.get(UserService),
  workflowLogService: injector.get(WorkflowLogService),
  workflowService: injector.get(WorkflowService),
};
