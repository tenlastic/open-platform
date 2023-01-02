export interface Environment {
  apiKey?: string;
  apiUrl: string;
}

export class EnvironmentService implements Environment {
  public apiKey: string;
  public apiUrl: string;

  constructor(environment: Environment) {
    this.apiKey = environment.apiKey;
    this.apiUrl = environment.apiUrl;
  }
}
