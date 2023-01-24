import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { unsetPlugin } from './';

const options = {
  boolean: { type: Boolean },
  exclude: { type: String, unset: false },
  number: { type: Number },
  string: { type: String },
};
const subdocumentSchema = new mongoose.Schema({ ...options, array: [], object: this });
const schema = new mongoose.Schema(
  { ...options, array: { type: [subdocumentSchema] }, object: { type: subdocumentSchema } },
  { collection: 'unset-plugins' },
);
schema.plugin(unsetPlugin);
const Model = mongoose.model('UnsetPlugin', schema);

describe('plugins/unset', function () {
  beforeEach(async function () {
    await Model.deleteMany();
  });

  describe(`pre('save')`, function () {
    it('removes empty primitive types', async function () {
      const record = await Model.create({
        array: [null],
        boolean: true,
        number: 1,
        object: {},
        string: 'string',
      });

      record.array = null;
      record.boolean = false;
      record.number = 0;
      record.object = null;
      record.string = '';
      await record.save();

      const result = await Model.findOne({ _id: record._id });
      expect(result.array).to.eql([]);
      expect(result.boolean).to.not.exist;
      expect(result.number).to.not.exist;
      expect(result.object).to.not.exist;
      expect(result.string).to.not.exist;
    });

    it('removes empty primitive types from subdocuments', async function () {
      const record = await Model.create({
        object: {
          array: [null],
          boolean: true,
          number: 1,
          object: {},
          string: 'string',
        },
      });

      record.object.array = null;
      record.object.boolean = false;
      record.object.number = 0;
      record.object.object = null;
      record.object.string = '';
      await record.save();

      const result = await Model.findOne({ _id: record._id });
      expect(result.object.array).to.eql([]);
      expect(result.object.boolean).to.not.exist;
      expect(result.object.number).to.not.exist;
      expect(result.object.object).to.not.exist;
      expect(result.object.string).to.not.exist;
    });

    it('removes empty primitive types from subdocument arrays', async function () {
      const record = await Model.create({
        array: [
          {
            array: [null],
            boolean: true,
            number: 1,
            object: {},
            string: 'string',
          },
        ],
      });

      record.array[0].array = null;
      record.array[0].boolean = false;
      record.array[0].number = 0;
      record.array[0].object = null;
      record.array[0].string = '';
      await record.save();

      const result = await Model.findOne({ _id: record._id });
      expect(result.array[0].array).to.eql([]);
      expect(result.array[0].boolean).to.not.exist;
      expect(result.array[0].number).to.not.exist;
      expect(result.array[0].object).to.not.exist;
      expect(result.array[0].string).to.not.exist;
    });

    it('skips excluded fields', async function () {
      const record = await Model.create({
        array: [{ exclude: 'exclude' }],
        exclude: 'exclude',
        object: { exclude: 'exclude' },
      });

      record.array[0].exclude = '';
      record.exclude = '';
      record.object.exclude = '';
      await record.save();

      const result = await Model.findOne({ _id: record._id });
      expect(result.array[0].exclude).to.eql('');
      expect(result.exclude).to.eql('');
      expect(result.object.exclude).to.eql('');
    });

    it('does not unset array elements', async function () {
      const record = await Model.create({
        object: {
          array: [],
        },
      });

      record.object.array = [0];
      await record.save();

      const result = await Model.findOne({ _id: record._id });
      expect(result.object.array).to.eql([0]);
    });
  });
});
