import * as k8s from '@kubernetes/client-node';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as sinon from 'sinon';

import { NamespaceGameServerLimitsMock, NamespaceLimitsMock, NamespaceMock } from '../namespace';
import { GameServerMock } from './model.mock';
import { GameServer } from './model';

const chance = new Chance();
let createNamespacedDeploymentStub: sinon.SinonStub;
let createNamespacedNetworkPolicyStub: sinon.SinonStub;
let createNamespacedPodStub: sinon.SinonStub;
let createNamespacedRoleBindingStub: sinon.SinonStub;
let createNamespacedRoleStub: sinon.SinonStub;
let createNamespacedSecretStub: sinon.SinonStub;
let createNamespacedServiceStub: sinon.SinonStub;
let createNamespacedServiceAccountStub: sinon.SinonStub;
let deleteNamespacedDeploymentStub: sinon.SinonStub;
let deleteNamespacedNetworkPolicyStub: sinon.SinonStub;
let deleteNamespacedPodStub: sinon.SinonStub;
let deleteNamespacedRoleStub: sinon.SinonStub;
let deleteNamespacedRoleBindingStub: sinon.SinonStub;
let deleteNamespacedSecretStub: sinon.SinonStub;
let deleteNamespacedServiceAccountStub: sinon.SinonStub;
let deleteNamespacedServiceStub: sinon.SinonStub;
let listNamespacedPodStub: sinon.SinonStub;
let patchNamespacedConfigMapStub: sinon.SinonStub;
let patchNamespacedServiceStub: sinon.SinonStub;
let readNamespacedSecretStub: sinon.SinonStub;
let sandbox: sinon.SinonSandbox;

use(chaiAsPromised);

beforeEach(function() {
  sandbox = sinon.createSandbox();

  createNamespacedDeploymentStub = sandbox
    .stub(k8s.AppsV1Api.prototype, 'createNamespacedDeployment')
    .resolves();
  createNamespacedNetworkPolicyStub = sandbox
    .stub(k8s.NetworkingV1Api.prototype, 'createNamespacedNetworkPolicy')
    .resolves();
  createNamespacedPodStub = sandbox.stub(k8s.CoreV1Api.prototype, 'createNamespacedPod').resolves();
  createNamespacedRoleStub = sandbox
    .stub(k8s.RbacAuthorizationV1Api.prototype, 'createNamespacedRole')
    .resolves();
  createNamespacedRoleBindingStub = sandbox
    .stub(k8s.RbacAuthorizationV1Api.prototype, 'createNamespacedRoleBinding')
    .resolves();
  createNamespacedSecretStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'createNamespacedSecret')
    .resolves();
  createNamespacedServiceStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'createNamespacedService')
    .resolves({
      body: {
        spec: {
          ports: [chance.integer()],
        },
      },
    });
  createNamespacedServiceAccountStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'createNamespacedServiceAccount')
    .resolves();

  deleteNamespacedDeploymentStub = sandbox
    .stub(k8s.AppsV1Api.prototype, 'deleteNamespacedDeployment')
    .resolves();
  deleteNamespacedNetworkPolicyStub = sandbox
    .stub(k8s.NetworkingV1Api.prototype, 'deleteNamespacedNetworkPolicy')
    .resolves();
  deleteNamespacedPodStub = sandbox.stub(k8s.CoreV1Api.prototype, 'deleteNamespacedPod').resolves();
  deleteNamespacedRoleStub = sandbox
    .stub(k8s.RbacAuthorizationV1Api.prototype, 'deleteNamespacedRole')
    .resolves();
  deleteNamespacedRoleBindingStub = sandbox
    .stub(k8s.RbacAuthorizationV1Api.prototype, 'deleteNamespacedRoleBinding')
    .resolves();
  deleteNamespacedSecretStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'deleteNamespacedSecret')
    .resolves();
  deleteNamespacedServiceAccountStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'deleteNamespacedServiceAccount')
    .resolves();
  deleteNamespacedServiceStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'deleteNamespacedService')
    .resolves();

  listNamespacedPodStub = sandbox.stub(k8s.CoreV1Api.prototype, 'listNamespacedPod').resolves({
    body: {
      items: [{ metadata: { name: chance.hash() } }],
    },
  });

  patchNamespacedConfigMapStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'patchNamespacedConfigMap')
    .resolves();
  patchNamespacedServiceStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'patchNamespacedService')
    .resolves();

  readNamespacedSecretStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'readNamespacedSecret')
    .resolves({
      body: {
        data: { key: 'value' },
        metadata: { name: chance.hash() },
        type: chance.hash(),
      },
    });
});

afterEach(function() {
  sandbox.restore();
});

describe('models/game-server/model', function() {
  describe('checkNamespaceLimits()', function() {
    it('enforces the gameServers.count Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ count: 1 }),
        }),
      });
      await GameServerMock.create({ namespaceId: namespace._id });

      const promise = GameServer.checkNamespaceLimits(1, 0.1, true, 0.1, namespace._id);

      expect(promise).to.be.rejectedWith('Namespace limit reached: gameServers.count.');
    });

    it('enforces the gameServers.cpu Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ cpu: 0.1 }),
        }),
      });

      const promise = GameServer.checkNamespaceLimits(0, 0.2, true, 0.1, namespace._id);

      expect(promise).to.be.rejectedWith('Namespace limit reached: gameServers.cpu.');
    });

    it('enforces the gameServers.memory Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ memory: 0.1 }),
        }),
      });

      const promise = GameServer.checkNamespaceLimits(0, 0.1, true, 0.2, namespace._id);

      expect(promise).to.be.rejectedWith('Namespace limit reached: gameServers.memory.');
    });

    it('enforces the gameServers.preemptible Namespace limit', async function() {
      const namespace = await NamespaceMock.create({
        limits: NamespaceLimitsMock.create({
          gameServers: NamespaceGameServerLimitsMock.create({ preemptible: true }),
        }),
      });

      const promise = GameServer.checkNamespaceLimits(0, 0.1, false, 0.1, namespace._id);

      expect(promise).to.be.rejectedWith('Namespace limit reached: gameServers.preemptible.');
    });
  });

  describe('createKubernetesResources()', function() {
    context('when persistent', function() {
      it(`creates Kubernetes resources`, async function() {
        await GameServerMock.create({ isPersistent: true });

        expect(createNamespacedDeploymentStub.calledTwice).to.eql(true);
        expect(createNamespacedServiceStub.calledOnce).to.eql(true);

        expect(patchNamespacedConfigMapStub.calledOnce).to.eql(true);
        expect(patchNamespacedServiceStub.calledOnce).to.eql(true);
      });
    });

    context('when not persistent', function() {
      it(`creates Kubernetes resources`, async function() {
        await GameServerMock.create();

        expect(createNamespacedPodStub.calledTwice).to.eql(true);
        expect(createNamespacedServiceStub.calledOnce).to.eql(true);

        expect(patchNamespacedConfigMapStub.calledOnce).to.eql(true);
        expect(patchNamespacedServiceStub.calledOnce).to.eql(true);
      });
    });
  });

  describe('restart()', function() {
    let names: string[];

    beforeEach(function() {
      names = [chance.hash(), chance.hash()];

      listNamespacedPodStub.restore();
      listNamespacedPodStub = sandbox.stub(k8s.CoreV1Api.prototype, 'listNamespacedPod').resolves({
        body: {
          items: [{ metadata: { name: names[0] } }, { metadata: { name: names[1] } }],
        },
      });
    });

    context('when persistent', function() {
      it('removes associated pods', async function() {
        const gameServer = await GameServerMock.create({ isPersistent: true });

        await gameServer.restart();

        const calls = deleteNamespacedPodStub.getCalls();
        expect(deleteNamespacedPodStub.calledTwice).to.eql(true);
        expect(calls[0].args[0]).to.eql(names[0]);
        expect(calls[1].args[0]).to.eql(names[1]);
      });
    });

    context('when not persistent', function() {
      it('throws an error', async function() {
        const gameServer = await GameServerMock.create();

        const promise = gameServer.restart();

        expect(promise).to.be.rejectedWith('Game Server must be persistent to be restarted.');
      });
    });
  });
});
