import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { EventEmitter, IDatabasePayload, changeStreamPlugin } from '../../change-stream';
import * as errors from '../../errors';
import { NamespaceDocument, NamespaceEvent } from '../namespace';

export const ModuleEvent = new EventEmitter<IDatabasePayload<ModuleDocument>>();

// Delete Modules if associated Namespace is deleted.
NamespaceEvent.sync(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Module.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

@index({ namespaceId: 1, type: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    collection: 'modules',
    discriminatorKey: 'type',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: ModuleEvent })
@plugin(errors.unique.plugin)
export class ModuleSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ required: true })
  public type: string;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;
}

export type ModuleDocument = DocumentType<ModuleSchema>;
export type ModuleModel = ReturnModelType<typeof ModuleSchema>;
export const Module = getModelForClass(ModuleSchema);
