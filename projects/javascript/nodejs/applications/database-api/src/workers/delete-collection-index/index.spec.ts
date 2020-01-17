import * as rabbitmq from '@tenlastic/rabbitmq';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { Collection, CollectionDocument, CollectionMock, Index, IndexDocument } from '../../models';
import { deleteCollectionIndexWorker } from './';

const chance = new Chance();

describe('workers/delete-collection-index', function() {
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

    beforeEach(async function() {
      channel = { ack: sinon.spy() };

      const index = new Index({ key: { properties: 1 }, options: { unique: true } });
      collection = await CollectionMock.create({ indexes: [index] });

      const collectionId = collection._id.toString();
      await mongoose.connection.db.collection(collectionId).createIndex(
        {
          properties: 1,
        },
        {
          name: index._id.toString(),
          unique: true,
        },
      );

      const content: Partial<IndexDocument> = {
        _id: index._id,
        collectionId,
        databaseId: collection.databaseId,
      };
      await deleteCollectionIndexWorker(channel as any, content, null);
    });

    it('deletes the index on the collection', async function() {
      const indexes = await mongoose.connection.db.collection(collection._id.toString()).indexes();

      expect(indexes.length).to.eql(1);
      expect(indexes[0].key).to.eql({ _id: 1 });
    });

    it('pulls the index from the Collection', async function() {
      const updatedCollection = await Collection.findOne({ _id: collection._id });

      expect(updatedCollection.indexes.length).to.eql(0);
    });

    it('acks the message', async function() {
      expect(channel.ack.calledOnce).to.eql(true);
    });
  });

  context('when unsuccessful', function() {
    it('nacks the message', async function() {
      const collection = await CollectionMock.create();
      const requeueStub = sandbox.stub(rabbitmq, 'requeue').resolves();

      const content: Partial<IndexDocument> = {
        _id: mongoose.Types.ObjectId(),
        collectionId: chance.hash() as any,
        databaseId: collection.databaseId,
      };
      await deleteCollectionIndexWorker({} as any, content as any, null);

      expect(requeueStub.calledOnce).to.eql(true);
    });
  });
});
