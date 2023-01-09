import mongoose from 'mongoose';

export function syncIndexes(Model: mongoose.Model<mongoose.Document>) {
  console.log(`Connection ready state: ${Model.db.readyState}.`);
  console.log(`Syncing indexes for ${Model.modelName}...`);

  const result = Model.syncIndexes({ background: true });

  console.log(`Synced indexes for ${Model.modelName} successfully.`);

  return result;
}
