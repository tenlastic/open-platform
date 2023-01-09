import * as mongoose from 'mongoose';

export async function getMongoStorage(connection: mongoose.Connection): Promise<number> {
  const stats = await connection.db.stats();
  return stats.totalSize;
}
