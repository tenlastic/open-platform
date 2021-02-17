import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  IOriginalDocument,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { Namespace, NamespaceDocument, NamespaceEvent, NamespaceLimitError } from '../namespace';
import { QueueDocument } from '../queue';
import { UserDocument } from '../user';

export enum GameServerStatus {
  Running = 'running',
  Terminated = 'terminated',
  Waiting = 'waiting',
}

export const GameServerEvent = new EventEmitter<IDatabasePayload<GameServerDocument>>();
export const GameServerRestartEvent = new EventEmitter<GameServerDocument>();

// Publish changes to Kafka.
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
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: GameServerEvent })
@plugin(uniqueErrorPlugin)
export class GameServerSchema implements IOriginalDocument {
  public _id: mongoose.Types.ObjectId;

  @arrayProp({ itemsRef: 'UserSchema' })
  public allowedUserIds: Array<Ref<UserDocument>>;

  @prop({ required: true })
  public buildId: mongoose.Types.ObjectId;

  @prop({ required: true })
  public cpu: number;

  public createdAt: Date;

  @arrayProp({ itemsRef: 'UserSchema' })
  public currentUserIds: Array<Ref<UserDocument>>;

  @prop()
  public description: string;

  @prop()
  public isPersistent: boolean;

  @prop()
  public isPreemptible: boolean;

  @prop({ required: true })
  public memory: number;

  @prop({ default: {} })
  public metadata: any;

  @prop({ required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
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

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;

  public static async checkNamespaceLimits(
    count: number,
    cpu: number,
    isPreemptible: boolean,
    memory: number,
    namespaceId: string | mongoose.Types.ObjectId,
  ) {
    const namespace = await Namespace.findOne({ _id: namespaceId });
    if (!namespace) {
      throw new Error('Record not found.');
    }

    const limits = namespace.limits.gameServers;
    if (limits.preemptible && isPreemptible === false) {
      throw new NamespaceLimitError('gameServers.preemptible', limits.preemptible);
    }

    if (limits.count > 0 || limits.cpu > 0 || limits.memory > 0) {
      const results = await GameServer.aggregate([
        { $match: { namespaceId: namespace._id } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            cpu: { $sum: '$cpu' },
            memory: { $sum: '$memory' },
          },
        },
      ]);

      const countSum = results.length > 0 ? results[0].count : 0;
      if (limits.count > 0 && countSum + count > limits.count) {
        throw new NamespaceLimitError('gameServers.count', limits.count);
      }

      const cpuSum = results.length > 0 ? results[0].cpu : 0;
      if (limits.cpu > 0 && cpuSum + cpu > limits.cpu) {
        throw new NamespaceLimitError('gameServers.cpu', limits.cpu);
      }

      const memorySum = results.length > 0 ? results[0].memory : 0;
      if (limits.memory > 0 && memorySum + memory > limits.memory) {
        throw new NamespaceLimitError('gameServers.memory', limits.memory);
      }
    }
  }

  /**
   * Returns a random port.
   */
  public getRandomPort(max = 65535, min = 60000) {
    return Math.round(Math.random() * (max - min) + min);
  }

  /**
   * Restarts a Game Server.
   */
  public async restart(this: GameServerDocument) {
    GameServerRestartEvent.emit(this);
  }
}

export type GameServerDocument = DocumentType<GameServerSchema>;
export type GameServerModel = ReturnModelType<typeof GameServerSchema>;
export const GameServer = getModelForClass(GameServerSchema);
