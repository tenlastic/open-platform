import * as mongoose from 'mongoose';

before(async function () {
  const connectionString = process.env.MONGO_CONNECTION_STRING;
  await mongoose.connect(connectionString, { dbName: 'mongoose-permissions-test' });
});
