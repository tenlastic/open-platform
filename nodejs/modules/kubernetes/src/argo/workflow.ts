import {
  V1EnvFromSource,
  V1EnvVar,
  V1NodeAffinity,
  V1PersistentVolumeClaimTemplate,
  V1PodAffinity,
  V1ResourceRequirements,
  V1Volume,
  V1VolumeMount,
} from '@kubernetes/client-node';
import { CustomObjectBaseApiV1 } from '../bases';

export interface V1Workflow {
  metadata: {
    annotations?: { [key: string]: string };
    labels?: { [key: string]: string };
    name: string;
    resourceVersion?: string;
    uid?: string;
  };
  spec: {
    activeDeadlineSeconds?: number;
    affinity?: {
      nodeAffinity?: V1NodeAffinity;
      podAffinity?: V1PodAffinity;
    };
    automountServiceAccountToken?: boolean;
    dnsPolicy?: string;
    entrypoint?: string;
    executor?: { serviceAccountName: string };
    parallelism?: number;
    podMetadata?: { labels: { [k: string]: string } };
    podPriorityClassName?: string;
    serviceAccountName?: string;
    shutdown?: 'Terminate';
    templates?: V1WorkflowSpecTemplate[];
    ttlStrategy?: { secondsAfterCompletion: number };
    volumeClaimTemplates?: V1PersistentVolumeClaimTemplate[];
    volumes?: V1Volume[];
  };
  status?: V1WorkflowStatus;
}

export interface V1WorkflowSpecTemplate {
  artifactLocation?: { archiveLogs: boolean };
  container?: V1WorkflowSpecTemplateContainer;
  dag?: { tasks?: V1WorkflowSpecTemplateDagTask[] };
  inputs?: {
    parameters?: Array<{ name: string; value: string }>;
  };
  metadata?: { labels: { [k: string]: string } };
  name?: string;
  retryStrategy?: {
    backoff?: {
      duration?: string;
      factor?: string;
    };
    limit?: number;
    retryStrategy?: string;
  };
  script?: {
    args?: string[];
    command?: string[];
    env?: V1EnvVar[];
    image: string;
    resources?: V1ResourceRequirements;
    source: string;
    volumeMounts?: V1VolumeMount[];
    workingDir?: string;
  };
  sidecars?: V1WorkflowSpecTemplateSidecar[];
  volumes?: V1Volume[];
}

export interface V1WorkflowSpecTemplateContainer {
  args?: string[];
  command?: string[];
  env?: V1EnvVar[];
  envFrom?: V1EnvFromSource[];
  image?: string;
  imagePullPolicy?: string;
  resources?: V1ResourceRequirements;
  volumeMounts?: V1VolumeMount[];
  workingDir?: string;
}

export interface V1WorkflowSpecTemplateDagTask {
  dependencies?: string[];
  name?: string;
  template?: string;
}

export interface V1WorkflowSpecTemplateSidecar {
  args?: string[];
  command?: string[];
  env?: V1EnvVar[];
  image?: string;
  name?: string;
  resources?: V1ResourceRequirements;
}

export interface V1WorkflowStatus {
  nodes?: V1WorkflowStatusNode[];
  version?: string;
}

export interface V1WorkflowStatusNode {
  children: string[];
  container: string;
  displayName: string;
  finishedAt: Date;
  id: string;
  logs: boolean;
  message: string;
  name: string;
  outboundNodes: string[];
  phase: WorkflowStatusPhase;
  pod: string;
  resources: V1ResourceRequirements;
  startedAt: Date;
  templateName: string;
  type: WorkflowStatusNodeType;
}

export enum WorkflowStatusNodeType {
  DAG = 'DAG',
  Pod = 'Pod',
  Retry = 'Retry',
  Skipped = 'Skipped',
}

export enum WorkflowStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

export class WorkflowApiV1 extends CustomObjectBaseApiV1<V1Workflow> {
  protected group = 'argoproj.io';
  protected kind = 'Workflow';
  protected plural = 'workflows';
  protected version = 'v1alpha1';

  protected getEndpoint(namespace: string) {
    return `/apis/argoproj.io/v1alpha1/namespaces/${namespace}/workflows`;
  }
}

export const workflowApiV1 = new WorkflowApiV1();
