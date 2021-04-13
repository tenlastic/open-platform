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
import * as mongoose from 'mongoose';

import { LogBase } from '../../bases';
import { QueueDocument, QueueEvent } from '../queue';

export const QueueLogEvent = new EventEmitter<IDatabasePayload<QueueLogDocument>>();

// Delete QueueLogs if associated Game Server is deleted.
QueueEvent.sync(async payload => {
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
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: QueueLogEvent })
@pre('save', function(this: QueueLogDocument) {
  this.expiresAt = new Date(this.createdAt);
  this.expiresAt.setDate(this.createdAt.getDate() + 3);
})
export class QueueLogSchema extends LogBase {
  @prop({ required: true })
  public nodeId: string;

  @prop({ immutable: true, ref: 'QueueSchema', required: true })
  public queueId: Ref<QueueDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'queueId', ref: 'QueueSchema' })
  public queueDocument: QueueDocument;
}

export type QueueLogDocument = DocumentType<QueueLogSchema>;
export type QueueLogModel = ReturnModelType<typeof QueueLogSchema>;

const schema = buildSchema(QueueLogSchema).set('collection', 'queuelogs');
export const QueueLog = addModelToTypegoose(
  mongoose.model('QueueLogSchema', schema),
  QueueLogSchema,
);
