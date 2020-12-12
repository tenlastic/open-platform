import {
  DocumentType,
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
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { UserDocument } from '../user';
import { NamespaceKey, NamespaceKeyDocument } from './key';
import { NamespaceLimitsDocument } from './limits';
import { NamespaceUser, NamespaceUserDocument } from './user';

export class NamespaceLimitError extends Error {
  public path: string;
  public value: any;

  constructor(path: string, value: any) {
    super(`Namespace limit reached: ${path}. Value: ${value}.`);

    this.name = 'NamespaceLimitError';
    this.path = path;
    this.value = value;
  }
}

export const NamespaceEvent = new EventEmitter<IDatabasePayload<NamespaceDocument>>();

export enum NamespaceRole {
  Articles = 'articles',
  Builds = 'builds',
  Collections = 'collections',
  GameServers = 'game-servers',
  GameInvitations = 'game-invitations',
  Games = 'games',
  Namespaces = 'namespaces',
  Queues = 'queues',
}

// Publish changes to Kafka.
NamespaceEvent.on(payload => {
  kafka.publish(payload);
});

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const coreV1 = kc.makeApiClient(k8s.CoreV1Api);

@index(
  { 'keys.value': 1 },
  {
    partialFilterExpression: {
      'keys.value': { $type: 'string' },
    },
    unique: true,
  },
)
@index({ name: 1 }, { unique: true })
@index({ 'keys.roles': 1 })
@index({ 'users._id': 1 })
@index({ 'users.roles': 1 })
@modelOptions({
  schemaOptions: {
    collection: 'namespaces',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: NamespaceEvent })
@plugin(uniqueErrorPlugin)
@pre('remove', async function(this: NamespaceDocument) {
  await this.deleteKubernetesResources();
})
@post('save', async function(this: NamespaceDocument) {
  await this.upsertKubernetesResources();
})
export class NamespaceSchema {
  public _id: mongoose.Types.ObjectId;

  public createdAt: Date;

  @arrayProp({ default: [], items: NamespaceKey })
  public keys: NamespaceKeyDocument[];

  @prop({ required: true })
  public limits: NamespaceLimitsDocument;

  @prop({ required: true })
  public name: string;

  public updatedAt: Date;

  @arrayProp({ default: [], items: NamespaceUser })
  public users: NamespaceUserDocument[];

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;

  private get kubernetesNamespace() {
    return `namespace-${this._id}`;
  }

  public static getDefaultUsers(
    users: Array<Partial<NamespaceUserDocument>>,
    user: Partial<UserDocument>,
  ) {
    const copy = users ? users.concat() : [];

    if (copy.length === 0) {
      const namespaceUser = new NamespaceUser({
        _id: user._id,
        roles: [NamespaceRole.Namespaces],
      });
      copy.push(namespaceUser);

      return copy;
    }

    if (copy.find(u => u.roles.includes(NamespaceRole.Namespaces))) {
      return copy;
    }

    const result = copy.find(u => u._id.toString() === user._id.toString());
    if (result) {
      result.roles.push(NamespaceRole.Namespaces);
    } else {
      const namespaceUser = new NamespaceUser({
        _id: user._id,
        roles: [NamespaceRole.Namespaces],
      });
      copy.push(namespaceUser);
    }

    return copy;
  }

  /**
   * Deletes a namespace within Kubernetes.
   */
  private async deleteKubernetesResources() {
    try {
      await coreV1.deleteNamespace(this.kubernetesNamespace);
    } catch {}
  }

  /**
   * Creates a namespace within Kubernetes if it does not exist.
   */
  private async upsertKubernetesResources() {
    try {
      await coreV1.readNamespace(this.kubernetesNamespace);
    } catch (e) {
      if (e instanceof k8s.HttpError && e.statusCode === 404) {
        await coreV1.createNamespace({ metadata: { name: this.kubernetesNamespace } });
      }
    }
  }
}

export type NamespaceDocument = DocumentType<NamespaceSchema>;
export type NamespaceModel = ReturnModelType<typeof NamespaceSchema>;
export const Namespace = getModelForClass(NamespaceSchema);
