import mongoose from 'mongoose';

export function enablePrePostImages(Model: mongoose.Model<mongoose.Document>) {
  const options = { changeStreamPreAndPostImages: { enabled: true } };
  return Model.db.db.command({ collMod: Model.collection.name, ...options });
}
