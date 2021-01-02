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
@index({ workflowId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'workflowlogs',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: WorkflowLogEvent })
@pre('save', function(this: WorkflowLogDocument) {
  this.expiresAt = new Date(this.createdAt);
  this.expiresAt.setDate(this.createdAt.getDate() + 3);
})
export class WorkflowLogSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true })
  public body: string;

  public createdAt: Date;

  @prop()
  public expiresAt: Date;

  @prop({ required: true })
  public nodeId: string;

  @prop({ required: true })
  public unix: number;

  public updatedAt: Date;

  @prop({ immutable: true, ref: 'WorkflowSchema', required: true })
  public workflowId: Ref<WorkflowDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'workflowId', ref: 'WorkflowSchema' })
  public workflowDocument: WorkflowDocument[];
}

export type WorkflowLogDocument = DocumentType<WorkflowLogSchema>;
export type WorkflowLogModel = ReturnModelType<typeof WorkflowLogSchema>;
export const WorkflowLog = getModelForClass(WorkflowLogSchema);
