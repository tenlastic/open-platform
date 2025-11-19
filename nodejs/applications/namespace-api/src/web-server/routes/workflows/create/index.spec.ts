import {
  AuthorizationModel,
  AuthorizationRole,
  NamespaceDocument,
  NamespaceLimitError,
  NamespaceLimitsModel,
  NamespaceModel,
  UserDocument,
  UserModel,
  WorkflowDocument,
  WorkflowSpecModel,
} from '@tenlastic/mongoose';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { ContextMock, CreateContext } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';

import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/workflows/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let ctx: CreateContext<WorkflowDocument>;
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ cpu: 1, memory: 1 * 1000 * 1000 * 1000 }),
      }).save();
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.WorkflowsRead, AuthorizationRole.WorkflowsWrite],
        userId: user._id,
      }).save();

      ctx = ContextMock({
        params: { namespaceId: namespace._id },
        request: {
          body: {
            cpu: 1,
            memory: 1 * 1000 * 1000 * 1000,
            name: chance.hash(),
            spec: WorkflowSpecModel.mock({ entrypoint: 'entrypoint' }),
            storage: 1 * 1000 * 1000 * 1000,
          },
        },
        state: { user: { _id: user._id.toHexString() } },
      });
    });

    context('when a Namespace Limit is exceeded', function () {
      it('throws an error', async function () {
        namespace.limits = NamespaceLimitsModel.mock({ cpu: 0.5 });
        await namespace.save();

        const promise = handler(ctx);

        return expect(promise).to.be.rejectedWith(NamespaceLimitError);
      });
    });

    context('when a Namespace Limit is not exceeded', function () {
      it('creates a Workflow', async function () {
        await handler(ctx);

        expect(ctx.response.body.record).to.exist;
      });
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceModel.mock({
        limits: NamespaceLimitsModel.mock({ cpu: 1, memory: 1 * 1000 * 1000 * 1000 }),
      }).save();

      const ctx = ContextMock<CreateContext<WorkflowDocument>>({
        params: { namespaceId: namespace._id },
        request: { body: { cpu: 1, memory: 1 * 1000 * 1000 * 1000, name: chance.hash() } },
        state: { user: { _id: user._id.toHexString() } },
      });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
