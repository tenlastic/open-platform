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
} from '@typegoose/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as mongoose from 'mongoose';

import { LogBase } from '../../bases';
import { namespaceValidator } from '../../validators';
import { WorkflowDocument, WorkflowEvent } from '../workflow';

export const WorkflowLogEvent = new EventEmitter<IDatabasePayload<WorkflowLogDocument>>();

// Delete WorkflowLogs if associated Game Server is deleted.
WorkflowEvent.sync(async payload => {
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
@index({ namespaceId: 1 })
@index({ nodeId: 1 })
@index({ workflowId: 1 })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: WorkflowLogEvent })
@pre('save', function(this: WorkflowLogDocument) {
  this.expiresAt = new Date(this.createdAt);
  this.expiresAt.setDate(this.createdAt.getDate() + 3);
})
export class WorkflowLogSchema extends LogBase {
  @prop({ required: true })
  public nodeId: string;

  @prop({
    ref: 'WorkflowSchema',
    required: true,
    validate: namespaceValidator('workflowDocument', 'workflowId'),
  })
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
