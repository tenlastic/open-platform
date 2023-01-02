import * as mongoose from 'mongoose';

export async function getMongoStorage(): Promise<number> {
  const stats = await mongoose.connection.db.stats();
  return stats.totalSize;
}
