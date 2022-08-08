export interface Environment {
  apiUrl: string;
}

export class EnvironmentService implements Environment {
  public apiUrl: string;

  constructor(environment: Environment) {
    this.apiUrl = environment.apiUrl;
  }
}
