import * as injector from '@tenlastic/dependency-injection';
import {
  ApiKeyInterceptor,
  ApiService,
  AuthorizationQuery,
  AuthorizationService,
  AuthorizationStore,
  EnvironmentService,
  NamespaceQuery,
  NamespaceService,
  NamespaceStore,
  StreamService,
} from '@tenlastic/http';
import { Axios } from 'axios';

const apiKey = process.env.API_KEY;
const apiUrl = process.env.API_URL;

injector.inject([
  {
    deps: [Axios, EnvironmentService],
    provide: ApiKeyInterceptor,
    useFactory: (axios: Axios, environmentService: EnvironmentService) =>
      new ApiKeyInterceptor(axios, environmentService),
  },
  {
    deps: [Axios],
    provide: ApiService,
    useFactory: (axios: Axios) => new ApiService(axios),
  },
  {
    deps: [AuthorizationStore],
    provide: AuthorizationQuery,
    useFactory: (authorizationStore: AuthorizationStore) =>
      new AuthorizationQuery(authorizationStore),
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
  { provide: AuthorizationStore, useValue: new AuthorizationStore() },
  { provide: Axios, useValue: new Axios() },
  { provide: EnvironmentService, useValue: new EnvironmentService({ apiKey, apiUrl }) },
  {
    deps: [NamespaceStore],
    provide: NamespaceQuery,
    useFactory: (namespaceStore: NamespaceStore) => new NamespaceQuery(namespaceStore),
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
  { provide: NamespaceStore, useValue: new NamespaceStore() },
  {
    deps: [EnvironmentService],
    provide: StreamService,
    useFactory: (environmentService: EnvironmentService) =>
      new StreamService(environmentService, null),
  },
]);

export default {
  apiService: injector.get(ApiService),
  authorizationQuery: injector.get(AuthorizationQuery),
  authorizationService: injector.get(AuthorizationService),
  authorizationStore: injector.get(AuthorizationStore),
  axios: injector.get(Axios),
  environmentService: injector.get(EnvironmentService),
  namespaceQuery: injector.get(NamespaceQuery),
  namespaceService: injector.get(NamespaceService),
  namespaceStore: injector.get(NamespaceStore),
  streamService: injector.get(StreamService),
};
