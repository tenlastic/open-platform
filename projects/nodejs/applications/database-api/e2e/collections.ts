import { expect } from 'chai';
import * as Chance from 'chance';

import { DatabaseDocument } from '../src/models';
import { CollectionModel, DatabaseModel } from './models';

const chance = new Chance();

describe('collections', function() {
  let database: Partial<DatabaseDocument>;

  beforeEach(async function() {
    const res = await DatabaseModel.create();
    database = res.body.record;
  });

  afterEach(async function() {
    await CollectionModel.deleteAll();
    await DatabaseModel.deleteAll();
  });

  it('creates a collection', async function() {
    const initialName = chance.name();
    const res = await CollectionModel.create({
      databaseId: database._id,
      name: initialName,
    });

    expect(res.statusCode).to.eql(200);
    expect(res.body.record.name).to.eql(initialName);
  });

  describe('working with an existing collection', function() {
    let record: any;

    beforeEach(async function() {
      const res = await CollectionModel.create({ databaseId: database._id });
      record = res.body.record;
    });

    it('finds the collection', async function() {
      const res = await CollectionModel.findOne({ _id: record._id, databaseId: database._id });

      expect(res.statusCode).to.eql(200);
      expect(res.body.record.name).to.eql(record.name);
    });

    it('updates the collection', async function() {
      const updatedName = chance.name();

      const res = await CollectionModel.update({
        _id: record._id,
        databaseId: database._id,
        name: updatedName,
      });

      expect(res.statusCode).to.eql(200);
      expect(res.body.record.name).to.eql(updatedName);
    });

    it('deletes the collection', async function() {
      const del = await CollectionModel.delete({ _id: record._id, databaseId: database._id });

      expect(del.statusCode).to.eql(200);
    });
  });
});
