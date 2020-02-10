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

import {
  CollectionMock,
  DatabaseMock,
  ReadonlyNamespaceMock,
  UserRolesMock,
} from '../../../models';
import { CREATE_COLLECTION_INDEX_QUEUE } from '../../../workers';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/indexes/create', function() {
  let user: any;

  beforeEach(async function() {
    user = { _id: new mongoose.Types.ObjectId(), roles: ['Administrator'] };
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
        const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
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
          const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
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
        let ctx: Context;

        beforeEach(async function() {
          const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
          const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
          const database = await DatabaseMock.create({ namespaceId: namespace._id });
          const collection = await CollectionMock.create({ databaseId: database._id });
          ctx = new ContextMock({
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
        });

        it('returns a 200 status code', async function() {
          expect(ctx.response.status).to.eql(200);
        });

        it('adds the request to RabbitMQ', async function() {
          return new Promise(resolve => {
            rabbitmq.consume(CREATE_COLLECTION_INDEX_QUEUE, (channel, content, msg) => {
              expect(content.key).to.eql({ properties: 1 });

              resolve();
            });
          });
        });
      });
    });
  });
});
