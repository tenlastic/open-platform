import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';
import * as mongoose from 'mongoose';

import { ReadonlyNamespace, ReadonlyNamespaceDocument } from '../readonly-namespace';

@index({ namespaceId: 1 })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'games',
    minimize: false,
    timestamps: true,
  },
})
export class ReadonlyGameSchema {
  public _id: mongoose.Types.ObjectId;

  public createdAt: Date;

  @prop()
  public description: string;

  @prop({ ref: ReadonlyNamespace })
  public namespaceId: Ref<ReadonlyNamespaceDocument>;

  @prop()
  public slug: string;

  @prop()
  public subtitle: string;

  @prop()
  public title: string;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: ReadonlyNamespace })
  public namespaceDocument: ReadonlyNamespaceDocument;
}

export type ReadonlyGameDocument = DocumentType<ReadonlyGameSchema>;
export type ReadonlyGameModel = ReturnModelType<typeof ReadonlyGameSchema>;
export const ReadonlyGame = getModelForClass(ReadonlyGameSchema);
