import * as mongoose from 'mongoose';

import { JsonSchemaType, mongooseToJson } from '../../json-schema';
import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';

export interface Schema {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  name: string;
  properties: unknown;
  type: JsonSchemaType;
  updatedAt?: Date;
}

export type SchemaDocument = mongoose.Document<mongoose.Types.ObjectId> & Schema;

export interface SchemaModelType extends mongoose.Model<SchemaDocument> {
  /**
   * Get the Mongoose model for the class using an optional existing connection.
   */
  getModel(existingConnection?: mongoose.Connection): mongoose.Model<SchemaDocument>;

  /**
   * Sync a Mongoose Model's schema into the persisted Schema record.
   */
  sync<T>(Model: mongoose.Model<T>): Promise<SchemaDocument>;
}

const SchemaSchema = new mongoose.Schema<SchemaDocument, SchemaModelType>(
  {
    name: { required: true, type: String },
    properties: { required: true, type: mongoose.Schema.Types.Mixed, unset: false },
    type: { enum: Object.keys(JsonSchemaType), required: true, type: String },
  },
  { collection: 'schemas', timestamps: true },
);

SchemaSchema.index({ name: 1 }, { unique: true });

SchemaSchema.plugin(duplicateKeyErrorPlugin);
SchemaSchema.plugin(unsetPlugin);

SchemaSchema.statics.sync = function (Model: mongoose.Model<mongoose.Document>) {
  return this.findOneAndUpdate(
    { name: Model.collection.name },
    { ...mongooseToJson(Model.schema), $inc: { __v: 1 } },
    { new: true, upsert: true },
  );
};

export function getSchemaModel(existingConnection?: mongoose.Connection) {
  const connection = existingConnection || mongoose.connection;
  return connection.model<SchemaDocument, SchemaModelType>('SchemaSchema', SchemaSchema);
}

export { SchemaSchema };
