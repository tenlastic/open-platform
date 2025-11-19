import * as mongoose from 'mongoose';

export async function replicateFromMongo(
  FromModel: mongoose.Model<mongoose.Document>,
  ToModel: mongoose.Model<mongoose.Document>,
  where: mongoose.FilterQuery<mongoose.Document> = {},
) {
  let count = 0;

  for await (const record of FromModel.find(where)) {
    await ToModel.updateOne({ _id: record._id }, record, { upsert: true });
    count++;
  }

  return count;
}
