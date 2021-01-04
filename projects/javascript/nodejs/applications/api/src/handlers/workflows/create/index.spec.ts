import {
  NamespaceMock,
  NamespaceUserMock,
  UserDocument,
  UserMock,
  WorkflowMock,
} from '@tenlastic/mongoose-models';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/workflows/create', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', function() {
    it('creates a new record', async function() {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['workflows'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });
      const workflow = await WorkflowMock.new({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        request: {
          body: workflow.toObject(),
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const namespace = await NamespaceMock.create();

      const ctx = new ContextMock({
        request: {
          body: {
            buildId: new mongoose.Types.ObjectId(),
            cpu: 0.1,
            memory: 0.1,
            name: chance.hash(),
            namespaceId: namespace._id,
          },
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
