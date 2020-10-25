import * as rabbitmq from '@tenlastic/rabbitmq';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import {
  Collection,
  CollectionDocument,
  CollectionMock,
  IndexDocument,
} from '@tenlastic/mongoose-models';
import { CreateCollectionIndex } from './';

const chance = new Chance();

describe('create-collection-index', function() {
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
        key: { properties: 1 },
        options: { unique: true },
      };

      await CreateCollectionIndex.onMessage(channel as any, index, null);
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
        key: { properties: 1 },
        options: { unique: true },
      };
      await CreateCollectionIndex.onMessage({} as any, content, null);

      expect(requeueStub.calledOnce).to.eql(true);
    });
  });
});
