import * as mongoose from 'mongoose';

export function syncIndexes<T>(Model: mongoose.Model<T>) {
  return Model.syncIndexes({ background: true });
}
