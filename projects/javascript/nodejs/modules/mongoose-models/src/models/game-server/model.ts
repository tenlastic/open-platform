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
import { UniquenessError, plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as fs from 'fs';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';
import * as path from 'path';

import { NamespaceDocument, NamespaceEvent } from '../namespace';
import { QueueDocument } from '../queue';
import { User, UserDocument } from '../user';

export enum GameServerStatus {
  Running = 'running',
  Terminated = 'terminated',
  Waiting = 'waiting',
}

export const GameServerEvent = new EventEmitter<IDatabasePayload<GameServerDocument>>();
GameServerEvent.on(payload => {
  kafka.publish(payload);
});

// Delete Game Servers if associated Namespace is deleted.
NamespaceEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await GameServer.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const appsV1 = kc.makeApiClient(k8s.AppsV1Api);
const rbacAuthorizationV1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);

@index({ namespaceId: 1 })
@index({ port: 1 }, { unique: true })
@index(
  { allowedUserIds: 1, namespaceId: 1 },
  {
    partialFilterExpression: {
      queueId: { $exists: true },
    },
    unique: true,
  },
)
@modelOptions({
  schemaOptions: {
    collection: 'gameservers',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: GameServerEvent,
})
@plugin(uniqueErrorPlugin)
@pre('remove', async function(this: GameServerDocument) {
  await this.deleteKubernetesResources();
})
@post('save', async function(this: GameServerDocument) {
  if (
    !this.wasNew &&
    !this.wasModified.includes('buildId') &&
    !this.wasModified.includes('isPersistent') &&
    !this.wasModified.includes('isPreemptible') &&
    !this.wasModified.includes('metadata')
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

  @arrayProp({ itemsRef: User })
  public allowedUserIds: Array<Ref<UserDocument>>;

  @prop({ required: true })
  public buildId: mongoose.Types.ObjectId;

  @prop({ required: true, validate: v => [0.1, 0.25, 0.5].includes(v) })
  public cpu: number;

  public createdAt: Date;

  @arrayProp({ itemsRef: User })
  public currentUserIds: Array<Ref<UserDocument>>;

  @prop()
  public description: string;

  @prop()
  public isPersistent: boolean;

  @prop()
  public isPreemptible: boolean;

  @prop({ required: true, validate: v => [0.1, 0.25, 0.5, 1, 2.5, 5].includes(v) })
  public memory: number;

  @prop({ default: {} })
  public metadata: any;

  @prop({ required: true })
  public name: string;

  @prop({ ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop()
  public port: number;

  @prop({ ref: 'QueueSchema' })
  public queueId: Ref<QueueDocument>;

  @prop({ default: GameServerStatus.Waiting, enum: GameServerStatus })
  public status: GameServerStatus;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: false, localField: 'allowedUserIds', ref: 'UserSchema' })
  public allowedUserDocuments: UserDocument[];

  @prop({ foreignField: '_id', justOne: false, localField: 'currentUserIds', ref: 'UserSchema' })
  public currentUserDocuments: UserDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'queueId', ref: 'QueueSchema' })
  public queueDocument: QueueDocument;

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
   * Returns a random port.
   */
  public getRandomPort(max = 65535, min = 60000) {
    return Math.round(Math.random() * (max - min) + min);
  }

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
    const administrator = { roles: ['game-servers'] };
    const accessToken = jwt.sign(
      { type: 'access', user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );

    const url = new URL(process.env.DOCKER_REGISTRY_URL);
    const image = `${url.host}/${this.namespaceId}:${this.buildId}`;

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
              {
                name: 'GAME_SERVER_JSON',
                value: JSON.stringify(this),
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
                cpu: `${this.cpu * 1000}m`,
                memory: `${this.memory * 1000}M`,
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
                name: 'GAME_SERVER_JSON',
                value: JSON.stringify(this),
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
            image: `tenlastic/health-check:${version}`,
            name: 'health-check',
            resources: {
              requests: {
                cpu: '50m',
                memory: '64M',
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
        restartPolicy: this.isPersistent ? 'Always' : 'Never',
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
          resources: ['pods/log', 'pods/status'],
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
}

export type GameServerDocument = DocumentType<GameServerSchema>;
export type GameServerModel = ReturnModelType<typeof GameServerSchema>;
export const GameServer = getModelForClass(GameServerSchema);

// Overload save() to automatically handle port conflicts.
const save = GameServer.prototype.save;
GameServer.prototype.save = async function(
  this: GameServerDocument,
  options: mongoose.SaveOptions,
  callback: (err: any, product?: GameServerDocument) => void,
) {
  this.port = this.port || this.getRandomPort();

  try {
    const result = await save.call(this, options);
    return callback ? callback(null, result) : result;
  } catch (e) {
    if (e instanceof UniquenessError && e.paths.includes('port')) {
      this.port = this.getRandomPort();
      return this.save(options, callback);
    }

    if (callback) {
      return callback(e);
    } else {
      throw e;
    }
  }
};
