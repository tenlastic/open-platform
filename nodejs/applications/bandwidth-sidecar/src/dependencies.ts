import * as injector from '@tenlastic/dependency-injection';
import {
  ApiKeyInterceptor,
  ApiService,
  EnvironmentService,
  GameServerService,
  RetryInterceptor,
} from '@tenlastic/http';
import { Axios } from 'axios';

const apiKey = process.env.API_KEY;
const apiUrl = process.env.API_URL;

injector.inject([
  {
    deps: [Axios, EnvironmentService],
    provide: ApiKeyInterceptor,
    useFactory: (axios: Axios, environmentService: EnvironmentService) =>
      new ApiKeyInterceptor(axios, environmentService, null),
  },
  {
    deps: [Axios],
    provide: ApiService,
    useFactory: (axios: Axios) => new ApiService(axios),
  },
  { provide: Axios, useValue: new Axios() },
  { provide: EnvironmentService, useValue: new EnvironmentService({ apiKey, apiUrl }) },
  {
    deps: [ApiService, EnvironmentService],
    provide: GameServerService,
    useFactory: (apiService: ApiService, environmentService: EnvironmentService) =>
      new GameServerService(apiService, environmentService),
  },
  {
    deps: [Axios],
    provide: RetryInterceptor,
    useFactory: (axios: Axios) => new RetryInterceptor(axios),
  },
]);

export default {
  apiService: injector.get(ApiService),
  axios: injector.get(Axios),
  environmentService: injector.get(EnvironmentService),
  gameServerService: injector.get(GameServerService),
};
