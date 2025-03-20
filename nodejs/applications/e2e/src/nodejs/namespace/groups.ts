import { IAuthorization, WebSocket } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import * as Chance from 'chance';

import dependencies from '../../dependencies';
import * as helpers from '../helpers';
import { expect } from 'chai';

const wssUrl = process.env.E2E_WSS_URL;

const chance = new Chance();

describe('/nodejs/namespace/groups', function () {
  let firstUsername: string;
  let firstWebSocket: WebSocket;
  let namespace: string;
  let secondUsername: string;
  let secondWebSocket: WebSocket;

  beforeEach(function () {
    firstUsername = chance.hash({ length: 24 });
    namespace = `NodeJS - Groups (${chance.hash({ length: 16 })})`;
    secondUsername = chance.hash({ length: 24 });
  });

  afterEach(async function () {
    dependencies.webSocketService.close(firstWebSocket);
    dependencies.webSocketService.close(secondWebSocket);

    await wait(1 * 1000, 15 * 1000, () => helpers.deleteNamespace(namespace));
    await wait(1 * 1000, 15 * 1000, () => helpers.deleteUser(firstUsername));
    await wait(1 * 1000, 15 * 1000, () => helpers.deleteUser(secondUsername));
  });

  it('creates a Namespace, Group, and Group Invitation', async function () {
    // Create the Namespace.
    const { _id } = await helpers.createNamespace(namespace);

    // Create the Users.
    const password = chance.hash();
    const firstUser = await dependencies.userService.create({ password, username: firstUsername });
    const secondUser = await dependencies.userService.create({
      password,
      username: secondUsername,
    });

    // Create Authorizations for the new Users.
    await dependencies.authorizationService.create(_id, {
      roles: [IAuthorization.Role.GroupsPlay],
      userId: firstUser._id,
    });
    await dependencies.authorizationService.create(_id, {
      roles: [IAuthorization.Role.GroupsPlay],
      userId: secondUser._id,
    });

    // Create the Web Socket connections.
    firstWebSocket = await helpers.createWebSocket(
      password,
      firstUser,
      `${wssUrl}/namespaces/${_id}`,
    );
    secondWebSocket = await helpers.createWebSocket(
      password,
      secondUser,
      `${wssUrl}/namespaces/${_id}`,
    );

    // Create the Group.
    let group = await dependencies.groupService.create(firstWebSocket);
    expect(group.members.length).to.eql(1);

    // Create the Group Invitation.
    await dependencies.groupInvitationService.create(_id, {
      groupId: group._id,
      toUserId: secondUser._id,
    });

    // Join the Group.
    group = await dependencies.groupService.addMember(group._id, secondWebSocket);
    expect(group.members.length).to.eql(2);
  });
});
