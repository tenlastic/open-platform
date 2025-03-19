import { ReturnModelType } from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

export function enablePrePostImages(
  Model: mongoose.Model<mongoose.Document> | ReturnModelType<any>,
) {
  const options = { changeStreamPreAndPostImages: { enabled: true } };
  return Model.db.db.command({ collMod: Model.collection.name, ...options });
}
