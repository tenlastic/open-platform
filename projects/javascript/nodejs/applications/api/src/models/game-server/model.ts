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

@index({ gameId: 1 })
@index({ port: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'gameservers',
    minimize: false,
    timestamps: true,
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

  // Delete outdated resources.
  await this.deleteKubernetesResources();

  // Delete created resources if entire stack is not successful.
  try {
    await this.createKubernetesResources();
  } catch (e) {
    console.error(e);
    await this.deleteKubernetesResources();
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

  @prop({ default: {} })
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

  @prop({ foreignField: '_id', justOne: false, localField: 'allowedUserIds', ref: User })
  public allowedUserDocuments: UserDocument[];

  @prop({ foreignField: '_id', justOne: false, localField: 'currentUserIds', ref: User })
  public currentUserDocuments: UserDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: Game })
  public gameDocument: GameDocument[];

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

    const name = `game-server-${this._id}`;
    const namespace = name;

    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const corev1 = kc.makeApiClient(k8s.CoreV1Api);

    const pods = await corev1.listNamespacedPod(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      `app=${name}`,
    );

    const promises = pods.body.items.map(item =>
      corev1.deleteNamespacedPod(item.metadata.name, namespace),
    );
    return Promise.all(promises);
  }

  /**
   * Creates a deployment and service within Kubernetes for the Game Server.
   */
  private async createKubernetesResources() {
    const administrator = { roles: ['Administrator'] };
    const accessToken = jwt.sign(
      { user: administrator },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      { algorithm: 'RS256' },
    );

    const name = `game-server-${this._id}`;
    const namespace = name;

    const url = new URL(process.env.DOCKER_REGISTRY_URL);
    const image = `${url.host}/${this.gameId}:${this.releaseId}`;

    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const appsv1 = kc.makeApiClient(k8s.AppsV1Api);
    const authorizationv1 = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
    const corev1 = kc.makeApiClient(k8s.CoreV1Api);

    const packageDotJson = fs.readFileSync(path.join(__dirname, '../../../package.json'), 'utf8');
    const version = JSON.parse(packageDotJson).version;

    /**
     * ======================
     * NAMESPACE
     * ======================
     */
    await corev1.createNamespace({ metadata: { name: namespace } });

    /**
     * ======================
     * ROLE + SERVICE ACCOUNT
     * ======================
     */
    await authorizationv1.createNamespacedRole(namespace, {
      metadata: {
        name,
      },
      rules: [
        {
          apiGroups: [''],
          resources: ['pods/log'],
          verbs: ['get', 'list', 'watch'],
        },
      ],
    });
    await corev1.createNamespacedServiceAccount(namespace, {
      metadata: {
        name,
      },
    });
    await authorizationv1.createNamespacedRoleBinding(namespace, {
      metadata: {
        name,
      },
      roleRef: {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Role',
        name,
      },
      subjects: [
        {
          kind: 'ServiceAccount',
          name,
          namespace,
        },
      ],
    });

    /**
     * =======================
     * POD DEFINITION
     * =======================
     */
    const podManifest: k8s.V1PodTemplateSpec = {
      metadata: {
        labels: {
          app: name,
        },
        name,
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
        serviceAccountName: name,
      },
    };

    /**
     * =======================
     * DEPLOYMENT / POD + SERVICE
     * =======================
     */
    if (this.isPersistent) {
      await appsv1.createNamespacedDeployment(namespace, {
        metadata: {
          labels: {
            app: name,
          },
          name,
        },
        spec: {
          replicas: 1,
          selector: {
            matchLabels: {
              app: name,
            },
          },
          template: podManifest,
        },
      });
    } else {
      await corev1.createNamespacedPod(namespace, podManifest);
    }

    // Create a Service to access the Game Server Pods.
    await corev1.createNamespacedService(namespace, {
      metadata: {
        labels: {
          app: name,
          service: name,
        },
        name,
      },
      spec: {
        ports: [
          {
            name: 'tcp',
            port: 7777,
          },
        ],
        selector: {
          app: name,
        },
      },
    });

    /**
     * =======================
     * NGINX
     * =======================
     */
    await corev1.patchNamespacedConfigMap(
      'nginx-ingress-tcp',
      namespace,
      {
        data: {
          [this.port]: `${namespace}/${name}:7777`,
        },
      },
      undefined,
      undefined,
      undefined,
      undefined,
      { headers: { 'Content-Type': 'application/strategic-merge-patch+json' } },
    );
    await corev1.patchNamespacedService(
      'nginx-ingress-controller',
      namespace,
      {
        spec: {
          ports: [
            {
              name,
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
    const name = `game-server-${this._id}`;
    const namespace = name;

    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const corev1 = kc.makeApiClient(k8s.CoreV1Api);

    try {
      await corev1.deleteNamespace(namespace);
    } catch {}

    try {
      await corev1.patchNamespacedConfigMap(
        'tcp-services',
        namespace,
        [{ op: 'remove', path: `/data/${this.port}` }],
        undefined,
        undefined,
        undefined,
        undefined,
        { headers: { 'Content-Type': 'application/json-patch+json' } },
      );
    } catch {}
  }

  private getRandomPort(max = 65535, min = 60000) {
    return Math.round(Math.random() * (max - min) + min);
  }
}

export type GameServerDocument = DocumentType<GameServerSchema>;
export type GameServerModel = ReturnModelType<typeof GameServerSchema>;
export const GameServer = getModelForClass(GameServerSchema);
