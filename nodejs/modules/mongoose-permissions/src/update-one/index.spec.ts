import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { IUser, PermissionError } from '../types';
import { updateOne } from './';

const chance = new Chance();
use(chaiAsPromised);

const Schema = new mongoose.Schema({
  jsonSchema: mongoose.Schema.Types.Mixed,
  properties: { merge: true, type: mongoose.Schema.Types.Mixed },
  name: String,
  parentId: mongoose.Schema.Types.ObjectId,
  urls: [String],
  userId: mongoose.Schema.Types.ObjectId,
});
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>(chance.hash(), Schema);

export const permissions = {
  roles: {
    admin: { 'authorization.roles': 'Admin' },
    default: {},
    owner: { 'record.userId': { $ref: 'user._id' } },
  },
  update: {
    admin: ['jsonSchema.*', 'name', 'properties.age', 'urls'],
  },
};

describe('update-one', function () {
  let name: string;
  let record: Document;
  let user: IUser;

  beforeEach(async function () {
    name = chance.hash();
    user = { _id: new mongoose.Types.ObjectId().toHexString() };

    record = await Model.create({
      jsonSchema: {
        properties: { fruits: ['apple', 'banana'], name: { type: 'string' } },
        type: 'object',
      },
      properties: { name },
      urls: [chance.url(), chance.url()],
      userId: user._id,
    });
  });

  afterEach(async function () {
    await Model.deleteMany();
  });

  context('when the user is an admin', function () {
    it('updates and returns the record', async function () {
      const context = {
        credentials: { authorization: { roles: ['Admin'] } },
        Model,
        options: permissions,
      };
      const baseParameters = {
        jsonSchema: {
          properties: { age: { type: 'number' }, fruits: ['cranberry'] },
          type: 'object',
        },
        name: chance.hash(),
        properties: { age: chance.integer(), name: chance.hash() },
        urls: [chance.url()],
      };

      record = await updateOne(context, baseParameters, {}, record);

      expect(record._id).to.eql(record._id);
      expect(record.jsonSchema.properties.age).to.eql(baseParameters.jsonSchema.properties.age);
      expect(record.jsonSchema.properties.fruits).to.to.eql(
        baseParameters.jsonSchema.properties.fruits,
      );
      expect(record.jsonSchema.properties.name).to.not.exist;
      expect(record.properties.age).to.eql(baseParameters.properties.age);
      expect(record.properties.name).to.equal(name);
      expect(record.name).to.eql(baseParameters.name);
      expect(record.urls.length).to.eql(1);
      expect(record.urls).to.eql(baseParameters.urls);
    });
  });

  context('when the user is not an admin', function () {
    it('throws an error', async function () {
      const context = {
        credentials: { authorization: { roles: [] } },
        Model,
        options: permissions,
      };
      const baseParameters = { name: chance.hash() };

      const promise = updateOne(context, baseParameters, {}, record);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
