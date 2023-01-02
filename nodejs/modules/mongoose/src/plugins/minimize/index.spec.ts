import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { minimizePlugin } from './';

const maximizeSchema = new mongoose.Schema(
  { subdocument: { type: mongoose.Schema.Types.Mixed } },
  { minimize: false },
);
const minimizeSchema = new mongoose.Schema({ subdocument: { type: mongoose.Schema.Types.Mixed } });
const schema = new mongoose.Schema(
  { maximize: { type: maximizeSchema }, minimize: { type: minimizeSchema } },
  { collection: 'set-plugins' },
);
schema.plugin(minimizePlugin);
const Model = mongoose.model('MinimizePlugin', schema);

describe('plugins/minimize', function () {
  beforeEach(async function () {
    await Model.deleteMany();
  });

  it('does not minimize subdocuments', function () {
    const document = new Model({ maximize: { subdocument: { key: {} } } });
    const json = document.toJSON();

    expect(document.maximize.subdocument).to.eql({ key: {} });
    expect(json.maximize.subdocument).to.eql({ key: {} });
  });

  it('minimizes subdocuments', function () {
    const document = new Model({ minimize: { subdocument: { key: {} } } });
    const json = document.toJSON();

    expect(document.minimize.subdocument).to.eql({ key: {} });
    expect(json.minimize.subdocument).to.not.exist;
  });
});
