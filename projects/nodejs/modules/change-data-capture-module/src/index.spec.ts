import * as mongoose from 'mongoose';

import { ChangeDataCapture } from './mongoose-plugin/change-data-capture.model';

const url = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(url, { useFindAndModify: false, useNewUrlParser: true });

beforeEach(function() {
  return ChangeDataCapture.deleteMany({});
});
