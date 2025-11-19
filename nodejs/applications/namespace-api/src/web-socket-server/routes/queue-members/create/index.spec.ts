import {
  AuthorizationModel,
  AuthorizationRole,
  NamespaceDocument,
  NamespaceModel,
  QueueModel,
  UserDocument,
  UserModel,
  WebSocketModel,
} from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-socket-server';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { CreateQueueMemberContext, handler } from './';

use(chaiAsPromised);

describe('web-socket-server/routes/queue-members/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
  });

  context('when permission is granted', function () {
    let ctx: CreateQueueMemberContext;
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceModel.mock().save();
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.QueuesRead, AuthorizationRole.QueuesWrite],
        userId: user._id,
      }).save();
      const queue = await QueueModel.mock({ namespaceId: namespace._id }).save();
      const webSocket = await WebSocketModel.mock({ namespaceId: namespace._id }).save();

      ctx = ContextMock<CreateQueueMemberContext>({
        request: { body: { queueId: queue._id } },
        state: {
          user: { _id: user._id.toHexString() },
          webSocket: {
            _id: webSocket._id.toHexString(),
            namespaceId: webSocket.namespaceId.toHexString(),
          },
        },
      });
    });

    it('creates a Queue Member', async function () {
      await handler(ctx);

      expect(ctx.response.body.record).to.exist;
    });
  });
});
