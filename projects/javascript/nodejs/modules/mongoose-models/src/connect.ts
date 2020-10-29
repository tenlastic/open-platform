import * as mongoose from 'mongoose';

export interface ConnectionOptions {
  connectionString: string;
  databaseName: string;
}

export function connect(options: ConnectionOptions) {
  return mongoose.connect(
    options.connectionString,
    {
      dbName: options.databaseName,
      useCreateIndex: true,
      useFindAndModify: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
    err => {
      if (err) {
        console.error(err);
      } else {
        console.log('Connected to MongoDB.');
      }
    },
  );
}
