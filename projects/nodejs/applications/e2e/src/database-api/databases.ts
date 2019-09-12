import { expect } from 'chai';
import * as Chance from 'chance';

import { DatabaseModel, NamespaceModel } from '../models';

const chance = new Chance();

describe('databases', function() {
  let namespace: NamespaceModel;

  before(async function() {
    const result = await NamespaceModel.create();
    namespace = result.body.record;

    // Wait for Namespace to propagate to Database API.
    await new Promise(resolve => setTimeout(resolve, 10000));
  });

  after(async function() {
    await NamespaceModel.deleteAll();
  });

  afterEach(async function() {
    await DatabaseModel.deleteAll();
  });

  it('creates a database', async function() {
    const initialName = chance.hash();

    const res = await DatabaseModel.create({ name: initialName, namespaceId: namespace._id });

    expect(res.statusCode).to.eql(200);
    expect(res.body.record.name).to.eql(initialName);
  });

  describe('working with an existing database', function() {
    let record: any;

    beforeEach(async function() {
      const res = await DatabaseModel.create({ namespaceId: namespace._id });
      record = res.body.record;
    });

    it('finds the database', async function() {
      const res = await DatabaseModel.findOne({ _id: record._id });

      expect(res.statusCode).to.eql(200);
      expect(res.body.record.name).to.eql(record.name);
    });

    it('updates the database', async function() {
      const updatedName = chance.hash();

      const res = await DatabaseModel.update({ _id: record._id, name: updatedName });

      expect(res.statusCode).to.eql(200);
      expect(res.body.record.name).to.eql(updatedName);
    });

    it('deletes the database', async function() {
      const del = await DatabaseModel.delete({ _id: record._id });

      expect(del.statusCode).to.eql(200);
    });
  });
});
