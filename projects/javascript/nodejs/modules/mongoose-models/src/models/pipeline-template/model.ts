import {
  DocumentType,
  Ref,
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
import * as mongoose from 'mongoose';

import { NamespaceDocument, NamespaceEvent } from '../namespace';
import { PipelineDocument, PipelineEvent } from '../pipeline';

export const PipelineTemplateEvent = new EventEmitter<IDatabasePayload<PipelineTemplateDocument>>();

// Publish changes to Kafka.
PipelineTemplateEvent.on(payload => {
  kafka.publish(payload);
});

// Delete PipelineTemplates if associated Namespace is deleted.
NamespaceEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await PipelineTemplate.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ namespaceId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'pipelinetemplates',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: PipelineTemplateEvent })
export class PipelineTemplateSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ _id: false, required: true })
  public pipelineTemplate: PipelineDocument;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;
}

export type PipelineTemplateDocument = DocumentType<PipelineTemplateSchema>;
export type PipelineTemplateModel = ReturnModelType<typeof PipelineTemplateSchema>;
export const PipelineTemplate = getModelForClass(PipelineTemplateSchema);
