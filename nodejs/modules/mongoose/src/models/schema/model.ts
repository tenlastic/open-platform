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
import { duplicateKeyErrorPlugin } from '../../plugins';

@index({ name: 1 }, { unique: true })
@modelOptions({
  options: { allowMixed: Severity.ALLOW },
  schemaOptions: { collection: 'schemas', minimize: false, timestamps: true },
})
@plugin(duplicateKeyErrorPlugin)
export class SchemaSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true, type: String })
  public name: string;

  @prop({ required: true, type: mongoose.Schema.Types.Mixed })
  public properties: any;

  @prop({ required: true, type: String })
  public type: string;

  public updatedAt: Date;

  public static sync(this: SchemaModel, model: mongoose.Model<mongoose.Document>) {
    return this.findOneAndUpdate(
      { name: model.collection.name },
      { ...mongooseToJson(model.schema), $inc: { __v: 1 } },
      { new: true, upsert: true },
    );
  }
}

export type SchemaDocument = DocumentType<SchemaSchema>;
export type SchemaModel = ReturnModelType<typeof SchemaSchema>;
