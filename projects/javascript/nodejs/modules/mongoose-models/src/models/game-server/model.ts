import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  post,
  pre,
  prop,
} from '@hasezoey/typegoose';
import * as k8s from '@kubernetes/client-node';
import {
  EventEmitter,
  IDatabasePayload,
  IOriginalDocument,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { Game, GameDocument } from '../game';
import { User, UserDocument } from '../user';

export const GameServerEvent = new EventEmitter<IDatabasePayload<GameServerDocument>>();
GameServerEvent.on(payload => {
  kafka.publish(payload);
});

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);

@index({ gameId: 1 })
@index({ port: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'gameservers',
    minimize: false,
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: GameServerEvent,
})
@pre('remove', async function(this: GameServerDocument) {
  await this.deleteKubernetesResources();
})
@pre('save', async function(this: GameServerDocument) {
  this.port = this.port || this.getRandomPort();
})
@post('save', async function(this: GameServerDocument) {
  if (
    !this.wasNew &&
    !this.wasModified.includes('isPersistent') &&
    !this.wasModified.includes('isPreemptible') &&
    !this.wasModified.includes('releaseId')
  ) {
    return;
  }

  if (this.wasNew) {
    // Delete created resources if entire stack is not successful.
    try {
      await this.createKubernetesResources();
    } catch (e) {
      await this.deleteKubernetesResources();
      throw e;
    }
  } else {
    await this.updateKubernetesResources();
  }
})
export class GameServerSchema implements IOriginalDocument {
  public _id: mongoose.Types.ObjectId;

  public createdAt: Date;

  @arrayProp({ itemsRef: User })
  public currentUserIds: Array<Ref<UserDocument>>;

  @prop()
  public description: string;

  @prop({ ref: Game, required: true })
  public gameId: Ref<GameDocument>;

  @prop()
  public heartbeatAt: Date;

  @prop()
  public isPersistent: boolean;

  @prop()
  public isPreemptible: boolean;

  @prop({
    _id: false,
    default: JSON.stringify({ type: 'object' }),
    get: value => (typeof value === 'string' ? JSON.parse(value) : value),
    set: value => (typeof value === 'string' ? value : JSON.stringify(value)),
  })
  public metadata: any;

  @prop({ required: true })
  public name: string;

  @prop()
  public port: number;

  @prop({ required: true })
  public releaseId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop()
  public url: string;

  @prop({ foreignField: '_id', justOne: false, localField: 'currentUserIds', ref: User })
  public currentUserDocuments: UserDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: Game })
  public gameDocument: GameDocument[];

  private get kubernetesNamespace() {
    return this.kubernetesResourceName;
  }

  private get kubernetesResourceName() {
    return `game-server-${this._id}`;
  }

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;

  /**
   * Restarts a persistent Game Server.
   */
  public async restart() {
    if (!this.isPersistent) {
      throw new Error('Game Server must be persistent to be restarted.');
    }

    const pods = await coreV1.listNamespacedPod(
      this.kubernetesNamespace,
      undefined,
      undefined,
      undefined,
      undefined,
      `app=${this.kubernetesResourceName}`,
    );

    const promises = pods.body.items.map(item =>
      coreV1.deleteNamespacedPod(item.metadata.name, this.kubernetesNamespace),
    );
    return Promise.all(promises);
  }

  private async createDeploymentOrPod() {
    const administrator = { roles: ['Administrator'] };
    const accessToken = jwt.sign(
      { user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );

    const url = new URL(process.env.DOCKER_REGISTRY_URL);
    const image = `${url.host}/${this.gameId}:${this.releaseId}`;

    const packageDotJson = fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8');
    const version = JSON.parse(packageDotJson).version;

    const podManifest: k8s.V1PodTemplateSpec = {
      metadata: {
        labels: {
          app: this.kubernetesResourceName,
        },
        name: this.kubernetesResourceName,
      },
      spec: {
        affinity: {
          nodeAffinity: {
            requiredDuringSchedulingIgnoredDuringExecution: {
              nodeSelectorTerms: [
                {
                  matchExpressions: [
                    {
                      key: 'cloud.google.com/gke-preemptible',
                      operator: this.isPreemptible ? 'Exists' : 'DoesNotExist',
                    },
                  ],
                },
              ],
            },
          },
        },
        containers: [
          {
            env: [
              {
                name: 'GAME_SERVER_ID',
                value: this._id.toHexString(),
              },
            ],
            image,
            name: 'application',
            ports: [
              {
                containerPort: 7777,
              },
            ],
            resources: {
              requests: {
                cpu: '500m',
                memory: '500M',
              },
            },
          },
          {
            env: [
              {
                name: 'ACCESS_TOKEN',
                value: accessToken,
              },
              {
                name: 'GAME_SERVER_ID',
                value: this._id.toHexString(),
              },
              {
                name: 'POD_NAME',
                valueFrom: {
                  fieldRef: {
                    fieldPath: 'metadata.name',
                  },
                },
              },
              {
                name: 'POD_NAMESPACE',
                valueFrom: {
                  fieldRef: {
                    fieldPath: 'metadata.namespace',
                  },
                },
              },
            ],
            image: `tenlastic/logs:${version}`,
            name: 'logs',
            resources: {
              requests: {
                cpu: '50m',
                memory: '64M',
              },
            },
          },
        ],
        imagePullSecrets: [{ name: 'docker-registry-image-pull-secret' }],
        serviceAccountName: this.kubernetesResourceName,
      },
    };

    /**
     * =======================
     * DEPLOYMENT / POD + SERVICE
     * =======================
     */
    if (this.isPersistent) {
      await appsV1.createNamespacedDeployment(this.kubernetesNamespace, {
        metadata: {
          labels: {
            app: this.kubernetesResourceName,
          },
          name: this.kubernetesResourceName,
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              app: this.kubernetesResourceName,
            },
          },
          template: podManifest,
        },
      });
    } else {
      await coreV1.createNamespacedPod(this.kubernetesNamespace, podManifest);
    }
  }

  /**
   * Creates a deployment and service within Kubernetes for the Game Server.
   */
  private async createKubernetesResources() {
    /**
     * ======================
     * NAMESPACE
     * ======================
     */
    await coreV1.createNamespace({ metadata: { name: this.kubernetesNamespace } });

    /**
     * ======================
     * ROLE + SERVICE ACCOUNT
     * ======================
     */
    await rbacAuthorizationV1.createNamespacedRole(this.kubernetesNamespace, {
      metadata: {
        name: this.kubernetesResourceName,
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['pods/log'],
          verbs: ['get', 'list', 'watch'],
        },
      ],
    });
    await coreV1.createNamespacedServiceAccount(this.kubernetesNamespace, {
      metadata: {
        name: this.kubernetesResourceName,
      },
    });
    await rbacAuthorizationV1.createNamespacedRoleBinding(this.kubernetesNamespace, {
      metadata: {
        name: this.kubernetesResourceName,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name: this.kubernetesResourceName,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name: this.kubernetesResourceName,
          namespace: this.kubernetesNamespace,
        },
      ],
    });

    /**
     * =======================
     * IMAGE PULL SECRET
     * =======================
     */
    const secret = await coreV1.readNamespacedSecret(
      'docker-registry-image-pull-secret',
      'default',
    );
    await coreV1.createNamespacedSecret(this.kubernetesNamespace, {
      data: secret.body.data,
      metadata: { name: secret.body.metadata.name },
      type: secret.body.type,
    });

    /**
     * =======================
     * PODS + SERVICE
     * =======================
     */
    await this.createDeploymentOrPod();
    await coreV1.createNamespacedService(this.kubernetesNamespace, {
      metadata: {
        labels: {
          app: this.kubernetesResourceName,
          service: this.kubernetesResourceName,
        },
        name: this.kubernetesResourceName,
      },
      spec: {
        ports: [
          {
            name: 'tcp',
            port: 7777,
          },
        ],
        selector: {
          app: this.kubernetesResourceName,
        },
      },
    });

    /**
     * =======================
     * NGINX
     * =======================
     */
    await coreV1.patchNamespacedConfigMap(
      'nginx-ingress-tcp',
      'default',
      {
        data: {
          [this.port]: `${this.kubernetesNamespace}/${this.kubernetesResourceName}:7777`,
        },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } },
    );
    await coreV1.patchNamespacedService(
      'nginx-ingress-controller',
      'default',
      {
        spec: {
          ports: [
            {
              name: this.kubernetesResourceName,
              port: this.port,
              protocol: 'TCP',
              targetPort: this.port,
            },
          ],
        },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } },
    );
  }

  /**
   * Deletes the associated deployment and service within Kubernetes.
   */
  private async deleteKubernetesResources() {
    try {
      await coreV1.deleteNamespace(this.kubernetesNamespace);
    } catch {}

    try {
      await coreV1.patchNamespacedConfigMap(
        'tcp-services',
        'default',
        [{ op: 'remove', path: `/data/${this.port}` }],
        undefined,
        undefined,
        undefined,
        undefined,
        { headers: { 'Content-Type': 'application/json-patch+json' } },
      );
    } catch {}
  }

  /**
   * Updates the associated deployment and service within Kubernetes.
   */
  private async updateKubernetesResources() {
    try {
      await appsV1.deleteNamespacedDeployment(
        this.kubernetesNamespace,
        this.kubernetesResourceName,
      );
    } catch {}

    try {
      await coreV1.deleteNamespacedPod(this.kubernetesNamespace, this.kubernetesResourceName);
    } catch {}

    await this.createDeploymentOrPod();
  }

  private getRandomPort(max = 65535, min = 60000) {
    return Math.round(Math.random() * (max - min) + min);
  }
}

export type GameServerDocument = DocumentType<GameServerSchema>;
export type GameServerModel = ReturnModelType<typeof GameServerSchema>;
export const GameServer = getModelForClass(GameServerSchema);