import * as kafka from '@tenlastic/kafka';
import * as mongoose from 'mongoose';

before(async function() {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING);

  await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
    dbName: 'mongoose-change-stream-kafka-test',
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});
