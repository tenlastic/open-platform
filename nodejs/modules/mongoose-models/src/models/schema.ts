import * as mongoose from 'mongoose';

export interface SchemaDocument extends mongoose.Document {
  name: string;
  properties: any;
  type: string;
}

export const SchemaSchema = new mongoose.Schema<SchemaDocument>(
  {
    name: { required: true, type: String },
    properties: { required: true, type: mongoose.Schema.Types.Mixed },
    type: { required: true, type: String },
  },
  { collection: 'schemas', timestamps: true },
);

SchemaSchema.index({ name: 1 }, { unique: true });

export type SchemaModel = mongoose.Model<SchemaDocument>;
export const Schema = mongoose.model<SchemaDocument>('SchemaSchema', SchemaSchema);
