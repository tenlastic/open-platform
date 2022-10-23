import * as mongooseModels from '@tenlastic/mongoose-models';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { replicateFromMongo } from './';

interface Document {
  name: string;
}

const chance = new Chance();

const schema = new mongoose.Schema<Document>({ name: String });

describe('replicateFromMongo()', function () {
  let fromConnection: mongoose.Connection;
  let FromModel: mongoose.Model<Document>;
  let toConnection: mongoose.Connection;
  let ToModel: mongoose.Model<Document>;

  before(async function () {
    fromConnection = await mongooseModels.createConnection({
      connectionString: process.env.MONGO_CONNECTION_STRING,
      databaseName: 'connector-test-from',
    });
    toConnection = await mongooseModels.createConnection({
      connectionString: process.env.MONGO_CONNECTION_STRING,
      databaseName: 'connector-test-to',
    });

    FromModel = fromConnection.model('from', schema);
    ToModel = toConnection.model('to', schema);
  });

  beforeEach(async function () {
    await FromModel.deleteMany({});
    await ToModel.deleteMany({});
  });

  it('copies documents between collections', async function () {
    const from = await FromModel.create({ name: chance.hash() });

    const count = await replicateFromMongo(
      FromModel.collection.name,
      fromConnection,
      ToModel.collection.name,
      toConnection,
    );

    expect(count).to.eql(1);

    const to = await ToModel.findOne();
    expect(from.id).to.eql(to.id);
    expect(from.name).to.eql(to.name);
  });
});
