import { mongooseToJson } from './json-schema';
import mongoose from 'mongoose';

import { SchemaModel, SchemaSchema } from './models';

export async function syncSchema(
  connection: mongoose.Connection,
  Model: mongoose.Model<mongoose.Document>,
) {
  const name = 'SchemaSchema';
  const Schema: SchemaModel = connection.models[name] ?? connection.model(name, SchemaSchema);

  return Schema.findOneAndUpdate(
    { name: Model.collection.name },
    { ...mongooseToJson(Model.schema), $inc: { __v: 1 } },
    { new: true, upsert: true },
  );
}
