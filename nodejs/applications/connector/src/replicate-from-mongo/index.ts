import * as mongooseModels from '@tenlastic/mongoose-models';

export async function replicateFromMongo(
  fromCollectionName: string,
  fromConnectionString: string,
  fromDatabaseName: string,
  toCollectionName: string,
  toConnectionString: string,
  toDatabaseName: string,
  where: any,
) {
  const fromConnection = await mongooseModels.createConnection({
    connectionString: fromConnectionString,
    databaseName: fromDatabaseName,
  });
  const toConnection = await mongooseModels.createConnection({
    connectionString: toConnectionString,
    databaseName: toDatabaseName,
  });

  const fromCollection = fromConnection.collection(fromCollectionName);
  const toCollection = toConnection.collection(toCollectionName);

  let count = 0;
  for await (const record of fromCollection.find(where)) {
    await toCollection.updateOne({ _id: record._id }, { $set: record }, { upsert: true });
    count++;
  }

  await fromConnection.close();
  await toConnection.close();

  return count;
}
