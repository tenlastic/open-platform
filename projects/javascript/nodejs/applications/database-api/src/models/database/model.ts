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
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { ReadonlyNamespace, ReadonlyNamespaceDocument } from '../readonly-namespace';

@index({ name: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'databases',
    minimize: false,
    timestamps: true,
  },
})
@plugin(uniqueErrorPlugin)
export class DatabaseSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ match: /^[0-9a-z\-]{2,40}$/, required: true })
  public name: string;

  @prop({ ref: ReadonlyNamespace, required: true })
  public namespaceId: Ref<ReadonlyNamespaceDocument>;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: ReadonlyNamespace })
  public namespaceDocument: ReadonlyNamespaceDocument;
}

export type DatabaseDocument = DocumentType<DatabaseSchema>;
export type DatabaseModel = ReturnModelType<typeof DatabaseSchema>;
export const Database = getModelForClass(DatabaseSchema);
