import { BaseModel } from './base';

export namespace IGameServer {
  export const Cpu = [
    { label: '0.1', value: 0.1 },
    { label: '0.25', value: 0.25 },
    { label: '0.5', value: 0.5 },
    { label: '1', value: 1 },
  ];
  export const Memory = [
    { label: '100 MB', value: 100 * 1000 * 1000 },
    { label: '250 MB', value: 250 * 1000 * 1000 },
    { label: '500 MB', value: 500 * 1000 * 1000 },
    { label: '1 GB', value: 1 * 1000 * 1000 * 1000 },
    { label: '2.5 GB', value: 2.5 * 1000 * 1000 * 1000 },
    { label: '5 GB', value: 5 * 1000 * 1000 * 1000 },
  ];

  export enum Protocol {
    Tcp = 'TCP',
    Udp = 'UDP',
  }

  export enum HttpProbeScheme {
    Http = 'Http',
    Https = 'Https',
  }

  export enum StatusComponentName {
    Application = 'Application',
    Sidecar = 'Sidecar',
  }

  export interface ExecProbe {
    command?: string[];
  }

  export interface HttpProbe {
    headers?: HttpProbeHeader[];
    path?: string;
    port?: number;
    scheme?: HttpProbeScheme;
  }

  export interface HttpProbeHeader {
    name?: string;
    value?: string;
  }

  export interface Port {
    port?: number;
    protocol?: Protocol;
  }

  export interface Probe {
    exec?: ExecProbe;
    failureThreshold?: number;
    http?: HttpProbe;
    initialDelaySeconds?: number;
    periodSeconds?: number;
    successThreshold?: number;
    tcp?: TcpProbe;
    timeoutSeconds?: number;
  }

  export interface Probes {
    liveness?: Probe;
    readiness?: Probe;
  }

  export interface Status {
    components?: StatusComponent[];
    endpoints?: StatusEndpoint[];
    message?: string;
    nodes?: StatusNode[];
    phase: string;
    version?: string;
  }

  export interface StatusComponent {
    current: number;
    name: StatusComponentName;
    phase: string;
    total: number;
  }

  export interface StatusEndpoint {
    externalIp?: string;
    externalPort?: number;
    internalIp?: string;
    internalPort?: number;
    protocol?: Protocol;
  }

  export interface StatusNode {
    component: StatusComponentName;
    container: string;
    phase: string;
    pod: string;
  }

  export interface TcpProbe {
    port?: number;
  }
}

export class GameServerModel extends BaseModel {
  public authorizedUserIds: string[];
  public buildId: string;
  public cpu: number;
  public currentUserIds: string[];
  public description: string;
  public memory: number;
  public metadata: any;
  public name: string;
  public namespaceId: string;
  public persistent: boolean;
  public ports: IGameServer.Port[];
  public preemptible: boolean;
  public probes: IGameServer.Probes;
  public queueId: string;
  public restartedAt: Date;
  public status: IGameServer.Status;

  constructor(parameters?: Partial<GameServerModel>) {
    super(parameters);
  }

  public static isRestartRequired(fields: string[]) {
    const immutableFields = [
      'buildId',
      'cpu',
      'memory',
      'ports',
      'preemptible',
      'probes',
      'restartedAt',
    ];

    return immutableFields.some((i) => fields.includes(i));
  }
}
