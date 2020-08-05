import { PermissionError } from '@tenlastic/mongoose-permissions';
import * as rabbitmq from '@tenlastic/rabbitmq';
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

import {
  CollectionMock,
  DatabaseMock,
  NamespaceMock,
  UserRolesMock,
  CollectionDocument,
} from '@tenlastic/mongoose-models';
import { CREATE_COLLECTION_INDEX_QUEUE } from '../../../workers';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/indexes/create', function() {
  let sandbox: sinon.SinonSandbox;
  let user: any;

  beforeEach(async function() {
    sandbox = sinon.createSandbox();
    user = { _id: new mongoose.Types.ObjectId(), roles: ['Administrator'] };
  });

  afterEach(async function() {
    sandbox.restore();
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

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });

  context('when the collection is found', function() {
    context('when the user does not have permission', function() {
      it('throws an error', async function() {
        const userRoles = UserRolesMock.create({ userId: user._id });
        const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
        const database = await DatabaseMock.create({ namespaceId: namespace._id });
        const collection = await CollectionMock.create({ databaseId: database._id });
        const ctx = new ContextMock({
          params: {
            collectionId: collection._id,
            databaseId: collection.databaseId,
          },
          state: { user: { _id: user._id } },
        });

        const promise = handler(ctx as any);

        return expect(promise).to.be.rejectedWith(PermissionError);
      });
    });

    context('when the user has permission', function() {
      context('when required fields are not supplied', function() {
        it('throws an error', async function() {
          const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
          const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
          const database = await DatabaseMock.create({ namespaceId: namespace._id });
          const collection = await CollectionMock.create({ databaseId: database._id });
          const ctx = new ContextMock({
            params: {
              collectionId: collection._id,
              databaseId: collection.databaseId,
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
          const stub = sandbox.stub(rabbitmq, 'publish').resolves();

          const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
          const namespace = await NamespaceMock.create({ accessControlList: [userRoles] });
          const database = await DatabaseMock.create({ namespaceId: namespace._id });
          const collection = await CollectionMock.create({ databaseId: database._id });

          const ctx = new ContextMock({
            params: {
              collectionId: collection._id,
              databaseId: collection.databaseId,
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
          expect(stub.getCalls()[0].args[0]).to.eql(CREATE_COLLECTION_INDEX_QUEUE);
          expect(stub.getCalls()[0].args[1]).to.exist;
        });
      });
    });
  });
});
