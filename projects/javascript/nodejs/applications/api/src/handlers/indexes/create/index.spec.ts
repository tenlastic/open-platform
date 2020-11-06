import { CollectionMock, NamespaceMock, NamespaceUserMock } from '@tenlastic/mongoose-models';
import { CreateCollectionIndex } from '@tenlastic/rabbitmq-models';
import {
  Context,
  ContextMock,
  RecordNotFoundError,
  RequiredFieldError,
} from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { handler } from './';

use(chaiAsPromised);

describe('handlers/indexes/create', function() {
  let sandbox: sinon.SinonSandbox;
  let user: any;

  beforeEach(async function() {
    sandbox = sinon.createSandbox();
    user = { _id: new mongoose.Types.ObjectId() };
  });

  afterEach(async function() {
    sandbox.restore();
  });

  context('when the collection is not found', function() {
    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          collectionId: new mongoose.Types.ObjectId(),
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });

  context('when the collection is found', function() {
    context('when the user does not have permission', function() {
      it('throws an error', async function() {
        const namespaceUser = NamespaceUserMock.create({ _id: user._id });
        const namespace = await NamespaceMock.create({ users: [namespaceUser] });
        const collection = await CollectionMock.create({ namespaceId: namespace._id });
        const ctx = new ContextMock({
          params: {
            collectionId: collection._id,
          },
          state: { user: { _id: user._id } },
        });

        const promise = handler(ctx as any);

        return expect(promise).to.be.rejectedWith(RecordNotFoundError);
      });
    });

    context('when the user has permission', function() {
      context('when required fields are not supplied', function() {
        it('throws an error', async function() {
          const namespaceUser = NamespaceUserMock.create({
            _id: user._id,
            roles: ['collections'],
          });
          const namespace = await NamespaceMock.create({ users: [namespaceUser] });
          const collection = await CollectionMock.create({ namespaceId: namespace._id });
          const ctx = new ContextMock({
            params: {
              collectionId: collection._id,
            },
            state: { user },
          });

          const promise = handler(ctx as any);

          return expect(promise).to.be.rejectedWith(
            RequiredFieldError,
            'Missing required field: key.',
          );
        });
      });

      context('when required fields are supplied', function() {
        it('adds the request to RabbitMQ', async function() {
          const stub = sandbox.stub(CreateCollectionIndex, 'publish').resolves();

          const namespaceUser = NamespaceUserMock.create({
            _id: user._id,
            roles: ['collections'],
          });
          const namespace = await NamespaceMock.create({ users: [namespaceUser] });
          const collection = await CollectionMock.create({ namespaceId: namespace._id });

          const ctx = new ContextMock({
            params: {
              collectionId: collection._id,
            },
            request: {
              body: {
                key: { properties: 1 },
              },
            },
            state: { user },
          }) as Context;

          await handler(ctx as any);

          expect(ctx.response.status).to.eql(200);

          expect(stub.calledOnce).to.eql(true);
        });
      });
    });
  });
});
