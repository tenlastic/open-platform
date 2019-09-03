import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Ref, Typegoose, index, prop } from 'typegoose';

import { ReadonlyNamespace, ReadonlyNamespaceDocument } from '../readonly-namespace';

@index({ name: 1 }, { unique: true })
export class DatabaseSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ match: /^[0-9a-z\-]{6,40}$/, required: true })
  public name: string;

  @prop({ ref: ReadonlyNamespace, required: true })
  public namespaceId: Ref<ReadonlyNamespaceDocument>;

  public updatedAt: Date;

  @prop({
    foreignField: '_id',
    justOne: true,
    localField: 'namespaceId',
    overwrite: true,
    ref: ReadonlyNamespace,
  })
  public get namespaceDocument(): ReadonlyNamespaceDocument {
    return this.namespaceDocument;
  }
}

export type DatabaseDocument = InstanceType<DatabaseSchema>;
export type DatabaseModel = ModelType<DatabaseSchema>;
export const Database = new DatabaseSchema().getModelForClass(DatabaseSchema, {
  schemaOptions: {
    autoIndex: false,
    collection: 'databases',
    minimize: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
});
