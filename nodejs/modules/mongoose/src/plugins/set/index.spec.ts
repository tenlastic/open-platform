import { expect } from 'chai';
import * as mongoose from 'mongoose';
import { alphabeticalKeysValidator } from '../../validators';

import { setPlugin } from './';

const subdocumentSchema = new mongoose.Schema(
  {
    permissions: {
      get: (value) => {
        return Object.entries(value).reduce((previous, [k, v]) => {
          previous[k] = typeof v === 'string' ? JSON.parse(v) : v;
          return previous;
        }, {});
      },
      set: (value) => {
        return Object.entries(value).reduce((previous, [k, v]) => {
          previous[k] = typeof v === 'string' ? v : JSON.stringify(v);
          return previous;
        }, {});
      },
      type: mongoose.Schema.Types.Mixed,
      validate: alphabeticalKeysValidator,
    },
  },
  { toJSON: { getters: true }, toObject: { getters: true } },
);
const schema = new mongoose.Schema(
  { subdocument: { type: subdocumentSchema } },
  { collection: 'set-plugins' },
);
schema.plugin(setPlugin);
const Model = mongoose.model('SetPlugin', schema);

describe('plugins/set', function () {
  beforeEach(async function () {
    await Model.deleteMany();
  });

  it('calls setters on subdocument fields', function () {
    const document = new Model({ subdocument: { permissions: { find: { key: 'value' } } } });
    const json = document.toJSON({ getters: false });

    expect(document.subdocument.permissions).to.eql({ find: { key: 'value' } });
    expect(json.subdocument.permissions).to.eql({ find: '{"key":"value"}' });
  });

  it('invalidates invalid subdocuments', async function () {
    const document = new Model({ subdocument: { permissions: { 0: { key: 'value' } } } });

    const { errors } = document.validateSync();
    expect(errors['subdocument.permissions'].message).to.eql('Keys can contain only letters.');
  });
});
