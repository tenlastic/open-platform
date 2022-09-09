import * as injector from '@tenlastic/dependency-injection';
import {
  ApiKeyInterceptor,
  ApiService,
  EnvironmentService,
  NamespaceQuery,
  NamespaceService,
  NamespaceStore,
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
]);

export default {
  apiService: injector.get(ApiService),
  axios: injector.get(Axios),
  environmentService: injector.get(EnvironmentService),
  namespaceQuery: injector.get(NamespaceQuery),
  namespaceService: injector.get(NamespaceService),
  namespaceStore: injector.get(NamespaceStore),
};
