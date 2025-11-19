import * as mongoose from 'mongoose';

export function enablePrePostImages<T>(Model: mongoose.Model<T>) {
  const options = { changeStreamPreAndPostImages: { enabled: true } };
  return Model.db.db.command({ collMod: Model.collection.name, ...options });
}
