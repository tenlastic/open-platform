import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { replicateFromMongo } from './';

const chance = new Chance();

const schema = new mongoose.Schema({ name: String });
const FromModel = mongoose.model('from', schema);
const ToModel = mongoose.model('to', schema);

describe('replicateFromMongo()', function () {
  beforeEach(async function () {
    await FromModel.deleteMany({});
    await ToModel.deleteMany({});
  });

  it('copies documents between collections', async function () {
    const from = await FromModel.create({ name: chance.hash() });

    const count = await replicateFromMongo(
      FromModel.collection.name,
      process.env.MONGO_CONNECTION_STRING,
      'connector-test',
      ToModel.collection.name,
      process.env.MONGO_CONNECTION_STRING,
      'connector-test',
      {},
    );

    expect(count).to.eql(1);

    const to = await ToModel.findOne();
    expect(from.id).to.eql(to.id);
    expect(from.name).to.eql(to.name);
  });
});
