import {
  DocumentType,
  Ref,
  ReturnModelType,
  addModelToTypegoose,
  buildSchema,
  index,
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

import { LogBase } from '../../bases';
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
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: GameServerLogEvent })
@pre('save', async function(this: GameServerLogDocument) {
  this.expiresAt = new Date(this.createdAt);
  this.expiresAt.setDate(this.createdAt.getDate() + 3);
})
export class GameServerLogSchema extends LogBase {
  @prop({ immutable: true, ref: 'GameServerSchema', required: true })
  public gameServerId: Ref<GameServerDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameServerId', ref: 'GameServerSchema' })
  public gameServerDocument: GameServerDocument;
}

export type GameServerLogDocument = DocumentType<GameServerLogSchema>;
export type GameServerLogModel = ReturnModelType<typeof GameServerLogSchema>;

const schema = buildSchema(GameServerLogSchema).set('collection', 'gameserverlogs');
export const GameServerLog = addModelToTypegoose(
  mongoose.model('GameServerLogSchema', schema),
  GameServerLogSchema,
);
