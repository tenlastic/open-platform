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

import { QueueDocument, QueueEvent } from '../queue';

export const QueueLogEvent = new EventEmitter<IDatabasePayload<QueueLogDocument>>();

// Publish changes to Kafka.
QueueLogEvent.on(payload => {
  kafka.publish(payload);
});

// Delete QueueLogs if associated Game Server is deleted.
QueueEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const queueId = payload.fullDocument._id;
      const records = await QueueLog.find({ queueId }).select('_id');
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ body: 'text' })
@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ queueId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'queuelogs',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: QueueLogEvent })
@pre('save', function(this: QueueLogDocument) {
  this.expiresAt = new Date(this.createdAt);
  this.expiresAt.setDate(this.createdAt.getDate() + 3);
})
export class QueueLogSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true })
  public body: string;

  public createdAt: Date;

  @prop()
  public expiresAt: Date;

  @prop({ immutable: true, required: true })
  public queueId: mongoose.Types.ObjectId;

  @prop({ required: true })
  public unix: number;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'queueId', ref: 'QueueSchema' })
  public queueDocument: QueueDocument[];
}

export type QueueLogDocument = DocumentType<QueueLogSchema>;
export type QueueLogModel = ReturnModelType<typeof QueueLogSchema>;
export const QueueLog = getModelForClass(QueueLogSchema);
