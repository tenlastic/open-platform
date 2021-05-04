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
import { BuildDocument, BuildEvent } from '../build';

export const BuildLogEvent = new EventEmitter<IDatabasePayload<BuildLogDocument>>();

// Delete BuildLogs if associated Game Server is deleted.
BuildEvent.sync(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const buildId = payload.fullDocument._id;
      const records = await BuildLog.find({ buildId }).select('_id');
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ body: 'text' })
@index({ buildId: 1 })
@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ namespaceId: 1 })
@index({ nodeId: 1 })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: BuildLogEvent })
@pre('save', function(this: BuildLogDocument) {
  this.expiresAt = new Date(this.createdAt);
  this.expiresAt.setDate(this.createdAt.getDate() + 3);
})
export class BuildLogSchema extends LogBase {
  @prop({
    ref: 'BuildSchema',
    required: true,
    validate: namespaceValidator('buildDocument', 'buildId'),
  })
  public buildId: Ref<BuildDocument>;

  @prop({ required: true })
  public nodeId: string;

  @prop({ foreignField: '_id', justOne: true, localField: 'buildId', ref: 'BuildSchema' })
  public buildDocument: BuildDocument;
}

export type BuildLogDocument = DocumentType<BuildLogSchema>;
export type BuildLogModel = ReturnModelType<typeof BuildLogSchema>;

const schema = buildSchema(BuildLogSchema).set('collection', 'buildlogs');
export const BuildLog = addModelToTypegoose(
  mongoose.model('BuildLogSchema', schema),
  BuildLogSchema,
);
