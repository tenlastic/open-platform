import { PermissionError } from '@tenlastic/mongoose-permissions';
import * as rabbitmq from '@tenlastic/rabbitmq';
import { Context, ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as mongoose from 'mongoose';

import { CollectionMock, DatabaseMock, Index } from '../../../models';
import { DELETE_COLLECTION_INDEX_QUEUE } from '../../../workers';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/indexes/delete', function() {
  let user: any;

  beforeEach(async function() {
    user = { _id: new mongoose.Types.ObjectId(), roles: ['Admin'] };
  });

  context('when the collection is not found', function() {
    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          collectionId: new mongoose.Types.ObjectId(),
          databaseId: new mongoose.Types.ObjectId(),
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError, 'Collection not found.');
    });
  });

  context('when the collection is found', function() {
    context('when the user does not have permission', function() {
      it('throws an error', async function() {
        const database = await DatabaseMock.create({ userId: user._id });
        const collection = await CollectionMock.create({ databaseId: database._id });
        const ctx = new ContextMock({
          params: {
            collectionId: collection._id,
            databaseId: collection.databaseId,
          },
          state: { user: { _id: user._id, roles: [] } },
        });

        const promise = handler(ctx as any);

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });

    context('when the user has permission', function() {
      context('when the collection does not contain the specified index', function() {
        it('throws an error', async function() {
          const database = await DatabaseMock.create({ userId: user._id });
          const index = new Index({ key: { properties: 1 } });
          const collection = await CollectionMock.create({ databaseId: database._id });
          const ctx = new ContextMock({
            params: {
              collectionId: collection._id,
              databaseId: collection.databaseId,
              id: index._id,
            },
            request: {
              body: {
                key: { properties: 1 },
              },
            },
            state: { user },
          }) as Context;

          const promise = handler(ctx as any);

          return expect(promise).to.be.rejectedWith(RecordNotFoundError, 'Index not found.');
        });
      });

      context('when the collection contains the specified index', function() {
        let ctx: Context;

        beforeEach(async function() {
          const database = await DatabaseMock.create({ userId: user._id });
          const index = new Index({ key: { properties: 1 } });
          const collection = await CollectionMock.create({
            databaseId: database._id,
            indexes: [index],
          });
          ctx = new ContextMock({
            params: {
              collectionId: collection._id,
              databaseId: collection.databaseId,
              id: index._id,
            },
            request: {
              body: {
                key: { properties: 1 },
              },
            },
            state: { user },
          }) as Context;

          await handler(ctx as any);
        });

        afterEach(async function() {
          await rabbitmq.purge(DELETE_COLLECTION_INDEX_QUEUE);
        });

        it('returns a 200 status code', async function() {
          expect(ctx.response.status).to.eql(200);
        });

        it('adds the request to RabbitMQ', async function() {
          return new Promise(resolve => {
            rabbitmq.consume(DELETE_COLLECTION_INDEX_QUEUE, (channel, content, msg) => {
              expect(content._id).to.eql(ctx.params.id.toString());

              resolve();
            });
          });
        });
      });
    });
  });
});
