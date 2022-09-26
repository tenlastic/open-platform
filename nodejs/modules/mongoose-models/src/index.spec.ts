import { connect } from './connect';

before(async function () {
  await connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'mongoose-models',
  });
});
