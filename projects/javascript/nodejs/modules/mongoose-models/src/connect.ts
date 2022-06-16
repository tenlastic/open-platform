import * as mongoose from 'mongoose';

export interface ConnectionOptions {
  connectionString: string;
  databaseName: string;
}

export async function connect(options: ConnectionOptions) {
  try {
    await mongoose.connect(options.connectionString, {
      autoCreate: true,
      autoIndex: false,
      dbName: options.databaseName,
    });
  } catch (e) {
    console.error(e);
  }

  console.log('Connected to MongoDB.');

  return mongoose;
}

export function createConnection(options: ConnectionOptions) {
  return mongoose.createConnection(options.connectionString, {
    autoCreate: true,
    autoIndex: false,
    dbName: options.databaseName,
  });
}
