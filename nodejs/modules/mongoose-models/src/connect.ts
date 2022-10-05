import * as mongoose from 'mongoose';

export interface ConnectionOptions {
  autoCreate?: boolean;
  autoIndex?: boolean;
  connectionString: string;
  databaseName: string;
}

export async function connect(options: ConnectionOptions) {
  mongoose.set('autoCreate', options.autoCreate);
  mongoose.set('autoIndex', options.autoIndex);

  await mongoose.connect(options.connectionString, {
    autoCreate: options.autoCreate,
    autoIndex: options.autoIndex,
    dbName: options.databaseName,
  });

  console.log(`Connected to MongoDB.`);
}

export function createConnection(options: ConnectionOptions) {
  mongoose.set('autoCreate', options.autoCreate);
  mongoose.set('autoIndex', options.autoIndex);

  return new Promise<mongoose.Connection>((resolve, reject) => {
    const connection = mongoose.createConnection(options.connectionString, {
      autoCreate: options.autoCreate,
      autoIndex: options.autoIndex,
      dbName: options.databaseName,
    });

    connection.on('error', (err) => {
      connection.close();
      return reject(err);
    });
    connection.on('open', () => resolve(connection));
  });
}
