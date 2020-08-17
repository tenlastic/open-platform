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
import { GameServerDocument } from '../game-server';

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

  @prop({ _id: false, required: true })
  public gameServerTemplate: GameServerDocument;

  @prop({ required: true })
  public name: string;

  @prop({ required: true })
  public usersPerTeam: number;

  @prop({ required: true })
  public teams: number;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: Game })
  public gameDocument: GameDocument;

  @prop({ foreignField: 'gameId', justOne: true, localField: 'gameId', ref: GameInvitation })
  public gameInvitationDocument: GameInvitationDocument;
}

export type QueueDocument = DocumentType<QueueSchema>;
export type QueueModel = ReturnModelType<typeof QueueSchema>;
export const Queue = getModelForClass(QueueSchema);
