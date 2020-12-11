import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import { GameServerDocument, GameServerEvent } from '../game-server';

export const GameServerLogEvent = new EventEmitter<IDatabasePayload<GameServerLogDocument>>();

// Publish changes to Kafka.
GameServerLogEvent.on(payload => {
  kafka.publish(payload);
});

// Delete GameServerLogs if associated Game Server is deleted.
GameServerEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const gameServerId = payload.fullDocument._id;
      const records = await GameServerLog.find({ gameServerId }).select('_id');
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ body: 'text' })
@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ gameServerId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'gameserverlogs',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: GameServerLogEvent })
@pre('save', function(this: GameServerLogDocument) {
  this.expiresAt = new Date(this.createdAt);
  this.expiresAt.setDate(this.createdAt.getDate() + 3);
})
export class GameServerLogSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true })
  public body: string;

  public createdAt: Date;

  @prop()
  public expiresAt: Date;

  @prop({ immutable: true, required: true })
  public gameServerId: mongoose.Types.ObjectId;

  @prop({ required: true })
  public unix: number;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameServerId', ref: 'GameServerSchema' })
  public gameServerDocument: GameServerDocument[];
}

export type GameServerLogDocument = DocumentType<GameServerLogSchema>;
export type GameServerLogModel = ReturnModelType<typeof GameServerLogSchema>;
export const GameServerLog = getModelForClass(GameServerLogSchema);
