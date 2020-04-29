import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  index,
  modelOptions,
  plugin,
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
  if (!this.isModified('releaseId')) {
    return;
  }

  await this.deleteKubernetesResources();
  await this.createKubernetesResources();
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
          },
        },
      },
    });

    const corev1 = kc.makeApiClient(k8s.CoreV1Api);
    const service = await corev1.createNamespacedService(namespace, {
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
        type: 'NodePort',
      },
    });

    const ip = service.body.spec.externalIPs ? service.body.spec.externalIPs[0] : '127.0.0.1';
    const port = service.body.spec.ports[0].nodePort;

    this.url = `${ip}:${port}`;
  }

  /**
   * Deletes the associated deployment and service within Kubernetes.
   */
  private async deleteKubernetesResources() {
    const name = `game-server-${this._id}`;
    const namespace = 'default';

    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    try {
      const appsv1 = kc.makeApiClient(k8s.AppsV1Api);
      await appsv1.deleteNamespacedDeployment(name, namespace);
    } catch {}

    try {
      const corev1 = kc.makeApiClient(k8s.CoreV1Api);
      await corev1.deleteNamespacedService(name, namespace);
    } catch {}
  }
}

export type GameServerDocument = DocumentType<GameServerSchema>;
export type GameServerModel = ReturnModelType<typeof GameServerSchema>;
export const GameServer = getModelForClass(GameServerSchema);
