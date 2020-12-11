import {
  DocumentType,
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
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { NamespaceDocument, NamespaceEvent } from '../namespace';
import { BuildEntrypointsDocument } from './entrypoints';

export const BuildEvent = new EventEmitter<IDatabasePayload<BuildDocument>>();

// Publish changes to Kafka.
BuildEvent.on(payload => {
  kafka.publish(payload);
});

// Delete Builds if associated Namespace is deleted.
NamespaceEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Build.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ namespaceId: 1, version: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    collection: 'builds',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: BuildEvent })
@plugin(uniqueErrorPlugin)
export class BuildSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ default: {} })
  public entrypoints: BuildEntrypointsDocument;

  @prop({ immutable: true, required: true })
  public namespaceId: mongoose.Types.ObjectId;

  @prop()
  public publishedAt: Date;

  @prop({ required: true })
  public version: string;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;
}

export type BuildDocument = DocumentType<BuildSchema>;
export type BuildModel = ReturnModelType<typeof BuildSchema>;
export const Build = getModelForClass(BuildSchema);
