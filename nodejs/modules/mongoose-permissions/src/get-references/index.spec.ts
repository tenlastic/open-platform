import { expect } from 'chai';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { getReferences } from './';

const chance = new Chance();

const Schema = new mongoose.Schema({ name: String });
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>(chance.hash(), Schema);

describe('get-references', function () {
  it('returns all the records', async function () {
    const credentials = {
      apiKey: chance.hash(),
      authorization: { roles: ['Admin'] },
      user: { _id: new mongoose.Types.ObjectId().toHexString() },
    };
    const record = new Model({ name: chance.hash() });

    const results = getReferences(credentials, record);

    expect(results.apiKey).to.eql(credentials.apiKey);
    expect(results.authorization).to.eql(credentials.authorization);
    expect(results.now).to.exist;
    expect(results.record).to.eql(record);
    expect(results.user).to.eql(credentials.user);
  });
});
