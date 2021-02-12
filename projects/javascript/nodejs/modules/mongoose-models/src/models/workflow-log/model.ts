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
import { WorkflowDocument, WorkflowEvent } from '../workflow';

export const WorkflowLogEvent = new EventEmitter<IDatabasePayload<WorkflowLogDocument>>();

// Publish changes to Kafka.
WorkflowLogEvent.on(payload => {
  kafka.publish(payload);
});

// Delete WorkflowLogs if associated Game Server is deleted.
WorkflowEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const workflowId = payload.fullDocument._id;
      const records = await WorkflowLog.find({ workflowId }).select('_id');
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ body: 'text' })
@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ nodeId: 1 })
@index({ workflowId: 1 })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: WorkflowLogEvent })
@pre('save', function(this: WorkflowLogDocument) {
  this.expiresAt = new Date(this.createdAt);
  this.expiresAt.setDate(this.createdAt.getDate() + 3);
})
export class WorkflowLogSchema extends LogBase {
  @prop({ immutable: true, required: true })
  public nodeId: string;

  @prop({ immutable: true, ref: 'WorkflowSchema', required: true })
  public workflowId: Ref<WorkflowDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'workflowId', ref: 'WorkflowSchema' })
  public workflowDocument: WorkflowDocument;
}

export type WorkflowLogDocument = DocumentType<WorkflowLogSchema>;
export type WorkflowLogModel = ReturnModelType<typeof WorkflowLogSchema>;

const schema = buildSchema(WorkflowLogSchema).set('collection', 'workflowlogs');
export const WorkflowLog = addModelToTypegoose(
  mongoose.model('WorkflowLogSchema', schema),
  WorkflowLogSchema,
);
