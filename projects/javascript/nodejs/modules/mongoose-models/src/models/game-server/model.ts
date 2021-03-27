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
import * as mongoose from 'mongoose';

import { namespaceValidator } from '../../validators';
import { BuildDocument } from '../build';
import { GameDocument } from '../game';
import { Namespace, NamespaceDocument, NamespaceEvent, NamespaceLimitError } from '../namespace';
import { QueueDocument, QueueEvent } from '../queue';
import { UserDocument } from '../user';
import { GameServerEndpointsSchema } from './endpoints';
import { GameServerStatusSchema } from './status';

export enum GameServerStatus {
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
  Unknown = 'Unknown',
}

export const GameServerEvent = new EventEmitter<IDatabasePayload<GameServerDocument>>();
export const GameServerRestartEvent = new EventEmitter<GameServerDocument>();

// Publish changes to Kafka.
GameServerEvent.sync(kafka.publish);

// Delete Game Servers if associated Namespace is deleted.
NamespaceEvent.sync(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await GameServer.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

// Delete Game Servers if associated Queue is deleted.
QueueEvent.sync(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await GameServer.find({ queueId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ authorizedUserIds: 1 })
@index({ currentUserIds: 1 })
@index({ namespaceId: 1 })
@index({ queueId: 1 })
@modelOptions({ schemaOptions: { collection: 'gameservers', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: GameServerEvent })
export class GameServerSchema implements IOriginalDocument {
  public _id: mongoose.Types.ObjectId;

  @arrayProp({ itemsRef: 'UserSchema' })
  public authorizedUserIds: Array<Ref<UserDocument>>;

  @prop({
    ref: 'BuildSchema',
    required: true,
    validate: namespaceValidator('buildDocument', 'buildId'),
  })
  public buildId: Ref<BuildDocument>;

  @prop({ min: 0, required: true })
  public cpu: number;

  public createdAt: Date;

  @arrayProp({ itemsRef: 'UserSchema' })
  public currentUserIds: Array<Ref<UserDocument>>;

  @prop()
  public description: string;

  @prop()
  public endpoints: GameServerEndpointsSchema;

  @prop({ ref: 'GameSchema', validate: namespaceValidator('gameDocument', 'gameId') })
  public gameId: Ref<GameDocument>;

  @prop()
  public isPersistent: boolean;

  @prop()
  public isPreemptible: boolean;

  @prop({ min: 0, required: true })
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

  @prop({ default: { phase: 'Pending' } })
  public status: GameServerStatusSchema;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: false, localField: 'authorizedUserIds', ref: 'UserSchema' })
  public authorizedUserDocuments: UserDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;

  @prop({ foreignField: '_id', justOne: false, localField: 'currentUserIds', ref: 'UserSchema' })
  public currentUserDocuments: UserDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: 'GameSchema' })
  public gameDocument: GameDocument;

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
   * Returns true if a restart is required on an update.
   */
  public static isRestartRequired(fields: string[]) {
    const immutableFields = [
      'buildId',
      'cpu',
      'isPersistent',
      'isPreemptible',
      'memory',
      'metadata',
    ];

    return immutableFields.some(i => fields.includes(i));
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
