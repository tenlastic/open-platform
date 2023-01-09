import mongoose from 'mongoose';

export async function syncIndexes(Model: mongoose.Model<mongoose.Document>) {
  console.log(`Connection ready state: ${Model.db.readyState}.`);
  console.log(`Syncing indexes for ${Model.modelName}...`);

  const result = await Model.syncIndexes({ background: true });

  console.log(`Synced indexes for ${Model.modelName} successfully.`);

  return result;
}
