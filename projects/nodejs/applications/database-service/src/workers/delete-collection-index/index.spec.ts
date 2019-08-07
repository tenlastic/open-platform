import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { Collection, CollectionDocument, CollectionMock } from '../../models';
import { DeleteCollectionIndexMessage, deleteCollectionIndexWorker } from './';

const chance = new Chance();

describe('workers/delete-collection-index', function() {
  context('when successful', function() {
    let channel: { ack: sinon.SinonSpy };
    let collection: CollectionDocument;

    beforeEach(async function() {
      const indexId = mongoose.Types.ObjectId();

      channel = { ack: sinon.spy() };
      collection = await CollectionMock.create({
        indexes: [
          {
            _id: indexId,
            key: { properties: 1 },
            options: { unique: true },
          },
        ],
      });

      const collectionId = collection._id.toString();
      await mongoose.connection.db.collection(collectionId).createIndex(
        {
          properties: 1,
        },
        {
          name: indexId.toHexString(),
          unique: true,
        },
      );

      const content: DeleteCollectionIndexMessage = {
        collectionId,
        databaseId: collection.databaseId.toString(),
        indexId: indexId.toHexString(),
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
      const channel = { nack: sinon.spy() };
      const collection = await CollectionMock.create();

      const content: DeleteCollectionIndexMessage = {
        collectionId: chance.hash(),
        databaseId: collection.databaseId.toString(),
        indexId: mongoose.Types.ObjectId().toHexString(),
      };
      await deleteCollectionIndexWorker(channel as any, content, null);

      expect(channel.nack.calledOnce).to.eql(true);
    });
  });
});
