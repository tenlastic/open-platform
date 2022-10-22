import { podApiV1 } from '@tenlastic/kubernetes';
import {
  AuthorizationMock,
  AuthorizationRole,
  NamespaceMock,
  NamespaceStatusMock,
  NamespaceStatusNodeMock,
  UserDocument,
  UserMock,
} from '../../../mongodb';
import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as sinon from 'sinon';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/namespaces/logs', function () {
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

      const namespace = await NamespaceMock.create({
        status: NamespaceStatusMock.create({
          nodes: [NamespaceStatusNodeMock.create({ _id: chance.hash() })],
        }),
      });
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.NamespacesRead],
        userId: user._id,
      });

      const ctx = new ContextMock({
        params: { _id: namespace._id, nodeId: namespace.status.nodes[0]._id },
        state: { user },
      });

      await handler(ctx as any);

      expect(ctx.response.body.records).to.exist;
      expect(ctx.response.body.records.length).to.eql(1);
    });

    it('throws an error', async function () {
      const namespace = await NamespaceMock.create();
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.NamespacesRead],
        userId: user._id,
      });

      const ctx = new ContextMock({
        params: { _id: namespace._id, nodeId: chance.hash() },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceMock.create();

      const ctx = new ContextMock({
        params: { _id: namespace._id, nodeId: chance.hash() },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
