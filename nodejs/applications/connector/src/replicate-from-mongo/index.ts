import * as mongoose from 'mongoose';

export async function replicateFromMongo(
  fromCollectionName: string,
  fromConnection: mongoose.Connection,
  toCollectionName: string,
  toConnection: mongoose.Connection,
) {
  const fromCollection = fromConnection.collection(fromCollectionName);
  const toCollection = toConnection.collection(toCollectionName);

  let count = 0;
  for await (const record of fromCollection.find()) {
    await toCollection.updateOne({ _id: record._id }, { $set: record }, { upsert: true });
    count++;
  }

  return count;
}
