import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import { Game, GameDocument } from '../game';
import { GameInvitation, GameInvitationDocument } from '../game-invitation';
import { Match } from '../match';
import { QueueMember } from '../queue-member';

export const QueueEvent = new EventEmitter<IDatabasePayload<QueueDocument>>();
QueueEvent.on(payload => {
  kafka.publish(payload);
});

@index({ gameId: 1 })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'queues',
    minimize: false,
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: QueueEvent,
})
export class QueueSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop()
  public description: string;

  @prop({ ref: Game, required: true })
  public gameId: Ref<GameDocument>;

  @prop({
    _id: false,
    default: JSON.stringify({ type: 'object' }),
    get: value => (typeof value === 'string' ? JSON.parse(value) : value),
    set: value => (typeof value === 'string' ? value : JSON.stringify(value)),
  })
  public metadata: any;

  @prop({ required: true })
  public name: string;

  @prop({ required: true })
  public playersPerTeam: number;

  @prop({ required: true })
  public teams: number;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: Game })
  public gameDocument: GameDocument;

  @prop({ foreignField: 'gameId', justOne: true, localField: 'gameId', ref: GameInvitation })
  public gameInvitationDocument: GameInvitationDocument;

  /**
   * Creates a new Match if enough Users are in-queue.
   */
  public async createMatch() {
    const threshold = this.teams * this.playersPerTeam;
    const queueMembers = await QueueMember.find({ queueId: this._id }).limit(threshold);

    if (queueMembers.length < this.teams * this.playersPerTeam) {
      return;
    }

    // Create a new Match.
    const userIds = queueMembers.map(qm => qm.userId);
    const match = await Match.create({ queueId: this._id, userIds });
    await Promise.all(queueMembers.map(qm => qm.remove()));

    return match;
  }
}

export type QueueDocument = DocumentType<QueueSchema>;
export type QueueModel = ReturnModelType<typeof QueueSchema>;
export const Queue = getModelForClass(QueueSchema);
