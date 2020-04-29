import * as rabbitmq from '@tenlastic/rabbitmq';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { Collection, CollectionDocument, CollectionMock, IndexDocument } from '../../models';
import { createCollectionIndexWorker } from './';

const chance = new Chance();

describe('workers/create-collection-index', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  context('when successful', function() {
    let channel: { ack: sinon.SinonSpy };
    let collection: CollectionDocument;
    let index: Partial<IndexDocument>;

    beforeEach(async function() {
      channel = { ack: sinon.spy() };
      collection = await CollectionMock.create();
      index = {
        _id: mongoose.Types.ObjectId(),
        collectionId: collection._id,
        databaseId: collection.databaseId,
        key: { properties: 1 },
        options: { unique: true },
      };

      await createCollectionIndexWorker(channel as any, index, null);
    });

    it('creates an index on the collection', async function() {
      const indexes = await mongoose.connection.db.collection(collection._id.toString()).indexes();

      expect(indexes[1].key).to.eql({ properties: 1 });
      expect(indexes[1].name).to.eql(index._id.toString());
      expect(indexes[1].unique).to.eql(true);
    });

    it('saves the index to the Collection', async function() {
      const updatedCollection = await Collection.findOne({ _id: collection._id });

      expect(updatedCollection.indexes[0]).to.exist;
      expect(updatedCollection.indexes[0]._id.toHexString()).to.eql(index._id.toHexString());
      expect(updatedCollection.indexes[0].key).to.eql({ properties: 1 });
      expect(updatedCollection.indexes[0].options).to.eql({ unique: true });
    });

    it('acks the message', async function() {
      expect(channel.ack.calledOnce).to.eql(true);
    });
  });

  context('when unsuccessful', function() {
    it('requeues the message', async function() {
      const collection = await CollectionMock.create();
      const requeueStub = sandbox.stub(rabbitmq, 'requeue').resolves();

      const content: Partial<IndexDocument> = {
        _id: mongoose.Types.ObjectId(),
        collectionId: chance.hash() as any,
        databaseId: collection.databaseId,
        key: { properties: 1 },
        options: { unique: true },
      };
      await createCollectionIndexWorker({} as any, content, null);

      expect(requeueStub.calledOnce).to.eql(true);
    });
  });
});
