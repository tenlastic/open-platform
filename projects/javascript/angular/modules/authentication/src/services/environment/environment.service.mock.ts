import { Injectable } from '@angular/core';

import { Environment } from './environment.service';

@Injectable()
export class EnvironmentServiceMock implements Environment {
  public loginUrl = 'http://localhost:8082/login';
  public logoutUrl = 'http://localhost:8082/logout';
}
