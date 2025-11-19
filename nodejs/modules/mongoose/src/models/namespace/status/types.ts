export enum NamespaceStatusComponentName {
  API = 'API',
  CDC = 'CDC',
  Connector = 'Connector',
  Metrics = 'Metrics',
  Migrations = 'Migrations',
  Sidecar = 'Sidecar',
}

export enum NamespaceStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}
