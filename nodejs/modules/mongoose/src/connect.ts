import { mongoose } from '@typegoose/typegoose';

export interface ConnectionOptions {
  autoCreate?: boolean;
  autoIndex?: boolean;
  connectionString: string;
  databaseName: string;
}

export async function connect(options: ConnectionOptions) {
  await mongoose.connect(options.connectionString, {
    autoCreate: options.autoCreate,
    autoIndex: options.autoIndex,
    dbName: options.databaseName,
  });

  console.log(`Connected to MongoDB.`);

  return mongoose.connection;
}

export function createConnection(options: ConnectionOptions) {
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
