import * as mongoose from 'mongoose';

export async function getMongoStorage() {
  const stats = await mongoose.connection.db.stats();
  return stats.totalSize;
}
