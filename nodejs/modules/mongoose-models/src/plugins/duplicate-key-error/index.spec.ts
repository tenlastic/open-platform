import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin } from './';

const chance = new Chance();

type Document = { name: string } & mongoose.Document;
const schema = new mongoose.Schema<Document>(
  { name: { required: true, type: String } },
  { collection: 'uniques' },
);
schema.index({ name: 1 }, { unique: true });
schema.plugin(duplicateKeyErrorPlugin);
const Model = mongoose.model<Document>('Unique', schema);

describe('plugins/duplicate-key-error', function () {
  before(async function () {
    await Model.syncIndexes();
  });

  afterEach(async function () {
    await Model.deleteMany();
  });

  describe(`post('findOneAndUpdate')`, function () {
    it('properly formats a unique MongoError', async function () {
      const name = chance.hash();
      await Model.create({ name });

      const record = await Model.create({ name: chance.hash() });

      try {
        await Model.findOneAndUpdate(
          { _id: record._id },
          { name },
          { context: 'query', runValidators: true },
        );
      } catch (e) {
        expect(e.message).to.eql('Record must have unique values for the following key: name.');
        expect(e.name).to.eql('DuplicateKeyError');
        expect(e.paths).to.eql(['name']);

        return;
      }

      throw new Error('Expected error to be thrown.');
    });

    it('allows other errors to propagate', async function () {
      const record = await Model.create({ name: chance.hash() });

      try {
        await Model.findOneAndUpdate(
          { _id: record._id },
          { name: null },
          { context: 'query', runValidators: true },
        );
      } catch (e) {
        expect(e.errors).to.exist;

        const error = e.errors.name;
        expect(error.kind).to.eql('required');
        expect(error.name).to.eql('ValidatorError');
        expect(error.path).to.eql('name');

        return;
      }

      throw new Error('Expected error to be thrown.');
    });

    it('does not interrupt a successful update', async function () {
      const record = await Model.create({ name: chance.hash() });
      await Model.findOneAndUpdate(
        { _id: record._id },
        { name: chance.hash() },
        { context: 'query', runValidators: true },
      );
    });
  });

  describe(`post('save')`, function () {
    it('properly formats a unique MongoError', async function () {
      const name = chance.hash();
      await Model.create({ name });

      try {
        await Model.create({ name });
      } catch (e) {
        expect(e.message).to.eql('Record must have unique values for the following key: name.');
        expect(e.name).to.eql('DuplicateKeyError');
        expect(e.paths).to.eql(['name']);

        return;
      }

      throw new Error('Expected error to be thrown.');
    });

    it('allows other errors to propagate', async function () {
      try {
        await Model.create({});
      } catch (e) {
        expect(e.errors).to.exist;

        const error = e.errors.name;
        expect(error.kind).to.eql('required');
        expect(error.name).to.eql('ValidatorError');
        expect(error.path).to.eql('name');

        return;
      }

      throw new Error('Expected error to be thrown.');
    });

    it('does not interrupt a successful save', async function () {
      await Model.create({ name: chance.hash() });
    });
  });
});
