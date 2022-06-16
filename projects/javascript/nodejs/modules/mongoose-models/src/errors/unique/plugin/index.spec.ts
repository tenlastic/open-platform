import { expect } from 'chai';
import * as Chance from 'chance';

import { Unique } from '../model';

const chance = new Chance();

describe('errors/unique/plugin', function () {
  describe(`post('findOneAndUpdate')`, function () {
    it('properly formats a unique MongoError', async function () {
      const name = chance.hash();
      await Unique.create({ name });

      const record = await Unique.create({ name: chance.hash() });

      try {
        await Unique.findOneAndUpdate(
          { _id: record._id },
          { name },
          { context: 'query', runValidators: true },
        );
      } catch (e) {
        expect(e.message).to.eql('Record must have unique values for the following key: name.');
        expect(e.name).to.eql('UniquenessError');
        expect(e.paths).to.eql(['name']);
        expect(e.values).to.eql([name]);

        return;
      }

      throw new Error('Expected error to be thrown.');
    });

    it('allows other errors to propagate', async function () {
      const record = await Unique.create({ name: chance.hash() });

      try {
        await Unique.findOneAndUpdate(
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
      const record = await Unique.create({ name: chance.hash() });
      await Unique.findOneAndUpdate(
        { _id: record._id },
        { name: chance.hash() },
        { context: 'query', runValidators: true },
      );
    });
  });

  describe(`post('save')`, function () {
    it('properly formats a unique MongoError', async function () {
      const name = chance.hash();
      await Unique.create({ name });

      try {
        await Unique.create({ name });
      } catch (e) {
        expect(e.message).to.eql('Record must have unique values for the following key: name.');
        expect(e.name).to.eql('UniquenessError');
        expect(e.paths).to.eql(['name']);
        expect(e.values).to.eql([name]);

        return;
      }

      throw new Error('Expected error to be thrown.');
    });

    it('allows other errors to propagate', async function () {
      try {
        await Unique.create({});
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
      await Unique.create({ name: chance.hash() });
    });
  });
});
