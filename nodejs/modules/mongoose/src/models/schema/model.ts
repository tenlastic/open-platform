import {
  DocumentType,
  index,
  modelOptions,
  plugin,
  prop,
  ReturnModelType,
  Severity,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { mongooseToJson } from '../../json-schema';
import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';

@index({ name: 1 }, { unique: true })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'schemas', timestamps: true },
})
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class SchemaSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true, type: String })
  public name: string;

  @prop({ required: true, type: mongoose.Schema.Types.Mixed, unset: false })
  public properties: any;

  @prop({ required: true, type: String })
  public type: string;

  public updatedAt: Date;

  public static sync(
    this: ReturnModelType<typeof SchemaSchema>,
    Model: mongoose.Model<mongoose.Document> | ReturnModelType<any>,
  ) {
    return this.findOneAndUpdate(
      { name: Model.collection.name },
      { ...mongooseToJson(Model.schema), $inc: { __v: 1 } },
      { new: true, upsert: true },
    );
  }
}

export type SchemaDocument = DocumentType<SchemaSchema>;
