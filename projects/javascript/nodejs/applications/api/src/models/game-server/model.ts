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
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import { Game, GameDocument } from '../game';
import { User, UserDocument } from '../user';

export const GameServerEvent = new EventEmitter<IDatabasePayload<GameServerDocument>>();
GameServerEvent.on(kafka.publish);

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
  // Delete outdated resources.
  await this.deleteKubernetesResources();

  // Delete created resources if entire stack is not successful.
  try {
    await this.createKubernetesResources();
  } catch (e) {
    await this.deleteKubernetesResources();
  }
})
export class GameServerSchema {
  public _id: mongoose.Types.ObjectId;

  @arrayProp({ itemsRef: User })
  public allowedUserIds: Array<Ref<UserDocument>>;

  public createdAt: Date;

  @arrayProp({ itemsRef: User })
  public currentUserIds: Array<Ref<UserDocument>>;

  @prop()
  public description: string;

  @prop({ ref: Game, required: true })
  public gameId: Ref<GameDocument>;

  @prop()
  public maxUsers: number;

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

  /**
   * Creates a deployment and service within Kubernetes for the Game Server.
   */
  private async createKubernetesResources() {
    const name = `game-server-${this._id}`;
    const namespace = 'default';

    const url = new URL(process.env.DOCKER_REGISTRY_URL);
    const image = `${url.host}/${this.gameId}:${this.releaseId}`;

    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const appsv1 = kc.makeApiClient(k8s.AppsV1Api);
    const corev1 = kc.makeApiClient(k8s.CoreV1Api);

    // Create Deployment and Service.
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
        template: {
          metadata: {
            labels: {
              app: name,
            },
          },
          spec: {
            containers: [
              {
                args: ['--gameServerId', this._id.toHexString()],
                image,
                name,
                ports: [
                  {
                    containerPort: 7777,
                  },
                ],
              },
            ],
            imagePullSecrets: [{ name: 'docker-registry-image-pull-secret' }],
          },
        },
      },
    });
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

    // Patch Nginx resources.
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
    const namespace = 'default';

    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    const appsv1 = kc.makeApiClient(k8s.AppsV1Api);
    const corev1 = kc.makeApiClient(k8s.CoreV1Api);

    try {
      await appsv1.deleteNamespacedDeployment(name, namespace);
    } catch {}

    try {
      await corev1.deleteNamespacedService(name, namespace);
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
