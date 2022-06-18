import * as mongoose from 'mongoose';

export interface ConnectionOptions {
  connectionString: string;
  databaseName: string;
}

export async function connect(options: ConnectionOptions) {
  await mongoose.connect(options.connectionString, {
    autoIndex: false,
    dbName: options.databaseName,
  });

  console.log('Connected to MongoDB.');
}

export function createConnection(options: ConnectionOptions) {
  return mongoose.createConnection(options.connectionString, {
    autoIndex: false,
    dbName: options.databaseName,
  });
}
