import * as injector from '@tenlastic/dependency-injection';
import {
  AccessTokenInterceptor,
  ApiService,
  AuthorizationService,
  BuildLogService,
  BuildService,
  CollectionService,
  EnvironmentService,
  GameServerLogService,
  GameServerService,
  GameServerTemplateService,
  GroupInvitationService,
  GroupService,
  LoginService,
  MatchService,
  NamespaceService,
  PasswordResetService,
  QueueLogService,
  QueueMemberService,
  QueueService,
  RecordService,
  RetryInterceptor,
  SubscriptionService,
  TeamService,
  TokenService,
  UserService,
  WebSocketService,
  WorkflowLogService,
  WorkflowService,
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
  { provide: EnvironmentService, useValue: new EnvironmentService({ apiUrl }) },
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
    provide: MatchService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new MatchService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: NamespaceService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new NamespaceService(apiService, environmentService),
  },
  {
    deps: [ApiService, EnvironmentService],
    provide: PasswordResetService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new PasswordResetService(apiService, environmentService),
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
    provide: RecordService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new RecordService(apiService, environmentService),
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
    useFactory: (loginService: LoginService) => new TokenService(null, loginService),
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

injector.inject([...components, ...interceptors, ...services]);

export default {
  apiService: injector.get(ApiService),
  axios: injector.get(Axios),
  authorizationService: injector.get(AuthorizationService),
  buildLogService: injector.get(BuildLogService),
  buildService: injector.get(BuildService),
  collectionService: injector.get(CollectionService),
  environmentService: injector.get(EnvironmentService),
  gameServerLogService: injector.get(GameServerLogService),
  gameServerService: injector.get(GameServerService),
  gameServerTemplateService: injector.get(GameServerTemplateService),
  groupInvitationService: injector.get(GroupInvitationService),
  groupService: injector.get(GroupService),
  loginService: injector.get(LoginService),
  matchService: injector.get(MatchService),
  namespaceService: injector.get(NamespaceService),
  passwordResetService: injector.get(PasswordResetService),
  queueLogService: injector.get(QueueLogService),
  queueMemberService: injector.get(QueueMemberService),
  queueService: injector.get(QueueService),
  recordService: injector.get(RecordService),
  subscriptionService: injector.get(SubscriptionService),
  teamService: injector.get(TeamService),
  tokenService: injector.get(TokenService),
  userService: injector.get(UserService),
  webSocketService: injector.get(WebSocketService),
  workflowLogService: injector.get(WorkflowLogService),
  workflowService: injector.get(WorkflowService),
};
