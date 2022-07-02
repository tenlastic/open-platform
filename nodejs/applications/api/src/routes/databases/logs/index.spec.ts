import { podApiV1 } from '@tenlastic/kubernetes';
import {
  DatabaseMock,
  DatabaseStatusMock,
  DatabaseStatusNodeMock,
  NamespaceMock,
  NamespaceUserMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as sinon from 'sinon';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('routes/databases/logs', function () {
  let sandbox: sinon.SinonSandbox;
  let user: UserDocument;

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
    user = await UserMock.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  context('when permission is granted', function () {
    it('returns log records', async function () {
      sandbox
        .stub(podApiV1, 'read')
        .resolves({ body: { spec: { containers: [{ name: chance.hash() }] } } });
      sandbox
        .stub(podApiV1, 'readNamespacedPodLog')
        .resolves([{ body: chance.hash(), unix: chance.floating() }]);

      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['databases'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });
      const database = await DatabaseMock.create({
        namespaceId: namespace._id,
        status: DatabaseStatusMock.create({
          nodes: [DatabaseStatusNodeMock.create({ _id: chance.hash() })],
        }),
      });

      const ctx = new ContextMock({
        params: { _id: database._id, nodeId: database.status.nodes[0]._id },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.records).to.exist;
      expect(ctx.response.body.records.length).to.eql(1);
    });

    it('throws an error', async function () {
      const namespaceUser = NamespaceUserMock.create({
        _id: user._id,
        roles: ['databases'],
      });
      const namespace = await NamespaceMock.create({ users: [namespaceUser] });
      const database = await DatabaseMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        params: { _id: database._id, nodeId: chance.hash() },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const database = await DatabaseMock.create();

      const ctx = new ContextMock({
        params: { _id: database._id, nodeId: chance.hash() },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
