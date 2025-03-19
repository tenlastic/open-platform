import { ReturnModelType } from '@typegoose/typegoose';
import mongoose from 'mongoose';

export function syncIndexes(Model: mongoose.Model<mongoose.Document> | ReturnModelType<any>) {
  return Model.syncIndexes({ background: true });
}
