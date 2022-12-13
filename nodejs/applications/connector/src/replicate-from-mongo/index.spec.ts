import * as mongoose from '@tenlastic/mongoose';
import { expect } from 'chai';
import * as Chance from 'chance';
import { Document, Model, Schema } from 'mongoose';

import { replicateFromMongo } from './';

interface ExampleDocument extends Document {
  name?: string;
}

const chance = new Chance();
const schema = new Schema<ExampleDocument>({ name: { type: String } });

describe('replicateFromMongo()', function () {
  let FromModel: Model<ExampleDocument>;
  let ToModel: Model<ExampleDocument>;

  before(async function () {
    const fromConnection = await mongoose.createConnection({
      connectionString: process.env.MONGO_CONNECTION_STRING,
      databaseName: 'connector-test-from',
    });
    const toConnection = await mongoose.createConnection({
      connectionString: process.env.MONGO_CONNECTION_STRING,
      databaseName: 'connector-test-to',
    });

    FromModel = fromConnection.model('from', schema);
    ToModel = toConnection.model('to', schema);
  });

  beforeEach(async function () {
    await FromModel.deleteMany();
    await ToModel.deleteMany();
  });

  it('copies documents between collections', async function () {
    const from = await FromModel.create({ name: chance.hash() });

    const count = await replicateFromMongo(FromModel, ToModel);

    expect(count).to.eql(1);

    const to = await ToModel.findOne();
    expect(from.id).to.eql(to.id);
    expect(from.name).to.eql(to.name);
  });
});
