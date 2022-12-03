import * as injector from '@tenlastic/dependency-injection';
import {
  ApiKeyInterceptor,
  ApiService,
  BuildQuery,
  BuildService,
  BuildStore,
  EnvironmentService,
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
    deps: [BuildStore],
    provide: BuildQuery,
    useFactory: (buildStore: BuildStore) => new BuildQuery(buildStore),
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
  { provide: BuildStore, useValue: new BuildStore() },
  { provide: Axios, useValue: new Axios() },
  { provide: EnvironmentService, useValue: new EnvironmentService({ apiKey, apiUrl }) },
  { provide: StreamService, useFactory: () => new StreamService() },
]);

export default {
  apiService: injector.get(ApiService),
  buildQuery: injector.get(BuildQuery),
  buildService: injector.get(BuildService),
  buildStore: injector.get(BuildStore),
  axios: injector.get(Axios),
  environmentService: injector.get(EnvironmentService),
  streamService: injector.get(StreamService),
};
