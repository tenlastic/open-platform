import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { Collection, CollectionDocument, CollectionMock } from '../../models';
import { CreateCollectionIndexMessage, createCollectionIndexWorker } from './';

const chance = new Chance();

describe('workers/create-collection-index', function() {
  context('when successful', function() {
    let channel: { ack: sinon.SinonSpy };
    let collection: CollectionDocument;
    let indexId: mongoose.Types.ObjectId;

    beforeEach(async function() {
      channel = { ack: sinon.spy() };
      collection = await CollectionMock.create();
      indexId = mongoose.Types.ObjectId();

      const content: CreateCollectionIndexMessage = {
        collectionId: collection._id.toString(),
        databaseId: collection.databaseId.toString(),
        indexId: indexId.toHexString(),
        key: { properties: 1 },
        options: { unique: true },
      };
      await createCollectionIndexWorker(channel as any, content, null);
    });

    it('creates an index on the collection', async function() {
      const indexes = await mongoose.connection.db.collection(collection._id.toString()).indexes();

      expect(indexes[1].key).to.eql({ properties: 1 });
      expect(indexes[1].name).to.eql(indexId.toHexString());
      expect(indexes[1].unique).to.eql(true);
    });

    it('saves the index to the Collection', async function() {
      const updatedCollection = await Collection.findOne({ _id: collection._id });

      expect(updatedCollection.indexes[0]).to.exist;
      expect(updatedCollection.indexes[0]._id).to.eql(indexId);
      expect(updatedCollection.indexes[0].key).to.eql({ properties: 1 });
      expect(updatedCollection.indexes[0].options).to.eql({ unique: true });
    });

    it('acks the message', async function() {
      expect(channel.ack.calledOnce).to.eql(true);
    });
  });

  context('when unsuccessful', function() {
    it('nacks the message', async function() {
      const channel = { nack: sinon.spy() };
      const collection = await CollectionMock.create();

      const content: CreateCollectionIndexMessage = {
        collectionId: chance.hash(),
        databaseId: collection.databaseId.toString(),
        indexId: mongoose.Types.ObjectId().toHexString(),
        key: { properties: 1 },
        options: { unique: true },
      };
      await createCollectionIndexWorker(channel as any, content, null);

      expect(channel.nack.calledOnce).to.eql(true);
    });
  });
});
