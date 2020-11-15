import {
  DocumentType,
  Ref,
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

export const LogEvent = new EventEmitter<IDatabasePayload<LogDocument>>();

// Publish changes to Kafka.
LogEvent.on(payload => {
  kafka.publish(payload);
});

// Delete Logs if associated Game Server is deleted.
GameServerEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Log.find({ gameServerId: payload.fullDocument._id }).select('_id');
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ body: 'text' })
@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ gameServerId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'logs',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: LogEvent })
@pre('save', function(this: LogDocument) {
  this.expiresAt = new Date(this.createdAt);
  this.expiresAt.setDate(this.createdAt.getDate() + 3);
})
export class LogSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true })
  public body: string;

  public createdAt: Date;

  @prop()
  public expiresAt: Date;

  @prop({ ref: 'GameServerSchema', required: true })
  public gameServerId: Ref<GameServerDocument>;

  @prop({ required: true })
  public unix: number;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameServerId', ref: 'GameServerSchema' })
  public gameServerDocument: GameServerDocument[];
}

export type LogDocument = DocumentType<LogSchema>;
export type LogModel = ReturnModelType<typeof LogSchema>;
export const Log = getModelForClass(LogSchema);
