import * as rabbitmq from '@tenlastic/rabbitmq';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import {
  Collection,
  CollectionDocument,
  CollectionMock,
  Index,
  IndexDocument,
} from '@tenlastic/mongoose-models';
import { DeleteCollectionIndex } from './';

const chance = new Chance();

describe('delete-collection-index', function() {
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
      index.collectionId = collection._id;

      await index.createMongoIndex();

      const content: Partial<IndexDocument> = {
        _id: index._id,
        collectionId: collection._id,
      };
      await DeleteCollectionIndex.onMessage(channel as any, content, null);
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
      };
      await DeleteCollectionIndex.onMessage({} as any, content as any, null);

      expect(requeueStub.calledOnce).to.eql(true);
    });
  });
});
