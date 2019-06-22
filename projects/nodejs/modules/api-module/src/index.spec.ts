import * as mongoose from 'mongoose';

import { Rest } from './rest/permissions/rest.model';

const url = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(url, { useFindAndModify: false, useNewUrlParser: true });

beforeEach(function() {
  return Rest.deleteMany({});
});
