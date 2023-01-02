import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { ModifiedPlugin, modifiedPlugin } from './';

const chance = new Chance();

type Document = { name: string } & ModifiedPlugin & mongoose.Document;
const schema = new mongoose.Schema<Document>(
  { name: { required: true, type: String } },
  { collection: 'modified-plugins' },
);
schema.plugin(modifiedPlugin);
const Model = mongoose.model<Document>('ModifiedPlugin', schema);

describe('plugins/modified', function () {
  beforeEach(async function () {
    await Model.deleteMany();
  });

  describe(`wasModified()`, function () {
    it('handles arrays', async function () {
      const record = await Model.create({ name: chance.hash() });

      const result = record.wasModified(['name']);

      expect(result).to.eql(true);
    });

    it('handles strings', async function () {
      const record = await Model.create({ name: chance.hash() });

      const result = record.wasModified('name');

      expect(result).to.eql(true);
    });

    it('handles nothing', async function () {
      const record = await Model.create({ name: chance.hash() });

      const result = record.wasModified();

      expect(result).to.eql(true);
    });
  });

  describe(`wasNew`, function () {
    it('returns true', async function () {
      const record = await Model.create({ name: chance.hash() });
      expect(record.wasNew).to.eql(true);
    });

    it('returns false', async function () {
      const record = await Model.create({ name: chance.hash() });
      await record.save();
      expect(record.wasNew).to.eql(false);
    });
  });
});
