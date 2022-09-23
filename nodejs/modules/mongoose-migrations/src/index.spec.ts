import * as mongoose from 'mongoose';

before(async function () {
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING, { dbName: 'mongoose-migrations' });
});
