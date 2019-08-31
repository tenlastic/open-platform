import { expect } from 'chai';
import * as Chance from 'chance';

import { NamespaceModel } from './models';

const chance = new Chance();

describe('namespaces', function() {
  afterEach(async function() {
    await NamespaceModel.deleteAll();
  });

  it('creates a namespace', async function() {
    const initialName = chance.hash();

    const res = await NamespaceModel.create({ name: initialName });

    expect(res.statusCode).to.eql(200);
    expect(res.body.record.name).to.eql(initialName);
  });

  describe('working with an existing namespace', function() {
    let record: any;

    beforeEach(async function() {
      const res = await NamespaceModel.create();
      record = res.body.record;
    });

    it('finds the namespace', async function() {
      const res = await NamespaceModel.findOne({ _id: record._id });

      expect(res.statusCode).to.eql(200);
      expect(res.body.record.name).to.eql(record.name);
    });

    it('updates the namespace', async function() {
      const updatedName = chance.hash();

      const res = await NamespaceModel.update({ _id: record._id, name: updatedName });

      expect(res.statusCode).to.eql(200);
      expect(res.body.record.name).to.eql(updatedName);
    });

    it('deletes the namespace', async function() {
      const del = await NamespaceModel.delete({ _id: record._id });

      expect(del.statusCode).to.eql(200);
    });
  });
});
