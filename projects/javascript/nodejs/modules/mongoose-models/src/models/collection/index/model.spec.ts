import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { CollectionMock } from '../model.mock';
import { IndexMock } from './model.mock';
import { Index } from './model';

use(chaiAsPromised);

describe('models/collection/model', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('createMongoIndex()', function() {
    it('creates an index on the collection within MongoDB', async () => {
      const collection = await CollectionMock.create();
      const index = await IndexMock.create({
        _id: mongoose.Types.ObjectId(),
        collectionId: collection._id,
        key: { properties: 1 },
        options: { unique: true },
      });

      await index.createMongoIndex();

      const indexes = await mongoose.connection.db.collection(collection._id.toString()).indexes();

      expect(indexes[1].key).to.eql({ properties: 1 });
      expect(indexes[1].name).to.eql(index._id.toString());
      expect(indexes[1].unique).to.eql(true);
    });
  });

  describe('deleteMongoIndex()', function() {
    it('deletes the index on the collection within MongoDB', async function() {
      const index = await IndexMock.create({
        key: { properties: 1 },
        options: { unique: true },
      });

      const collection = await CollectionMock.create({ indexes: [index] });
      index.collectionId = collection._id;

      await index.createMongoIndex();
      await index.deleteMongoIndex();

      const indexes = await mongoose.connection.db.collection(collection._id.toString()).indexes();

      expect(indexes.length).to.eql(1);
      expect(indexes[0].key).to.eql({ _id: 1 });
    });
  });
});
