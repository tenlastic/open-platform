import mongoose from 'mongoose';

export function syncIndexes(Model: mongoose.Model<mongoose.Document>) {
  return Model.syncIndexes({ background: true });
}
