import * as k8s from '@kubernetes/client-node';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as request from 'request';
import * as sinon from 'sinon';

import { GameServerMock } from './model.mock';

const chance = new Chance();
let createNamespacedDeploymentStub: sinon.SinonStub;
let createNamespacedPodStub: sinon.SinonStub;
let createNamespacedServiceStub: sinon.SinonStub;
let deleteNamespacedDeploymentStub: sinon.SinonStub;
let deleteNamespacedPodStub: sinon.SinonStub;
let deleteNamespacedServiceStub: sinon.SinonStub;
let listNamespacedPodStub: sinon.SinonStub;
let patchNamespacedConfigMapStub: sinon.SinonStub;
let patchNamespacedServiceStub: sinon.SinonStub;
let readNamespacedPodLogStub: sinon.SinonStub;
let sandbox: sinon.SinonSandbox;

use(chaiAsPromised);

beforeEach(function() {
  sandbox = sinon.createSandbox();

  createNamespacedDeploymentStub = sandbox
    .stub(k8s.AppsV1Api.prototype, 'createNamespacedDeployment')
    .resolves();
  createNamespacedPodStub = sandbox.stub(k8s.CoreV1Api.prototype, 'createNamespacedPod').resolves();
  createNamespacedServiceStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'createNamespacedService')
    .resolves({
      body: {
        spec: {
          ports: [chance.integer()],
        },
      },
    });

  deleteNamespacedDeploymentStub = sandbox
    .stub(k8s.AppsV1Api.prototype, 'deleteNamespacedDeployment')
    .resolves();
  deleteNamespacedPodStub = sandbox.stub(k8s.CoreV1Api.prototype, 'deleteNamespacedPod').resolves();
  deleteNamespacedServiceStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'deleteNamespacedService')
    .resolves();

  listNamespacedPodStub = sandbox.stub(k8s.CoreV1Api.prototype, 'listNamespacedPod').resolves();

  patchNamespacedConfigMapStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'patchNamespacedConfigMap')
    .resolves();
  patchNamespacedServiceStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'patchNamespacedService')
    .resolves();

  readNamespacedPodLogStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'readNamespacedPodLog')
    .resolves();
});

afterEach(function() {
  sandbox.restore();
});

describe('models/game-server/model', function() {
  describe('createKubernetesResources()', function() {
    context('when persistent', function() {
      it(`creates Kubernetes resources`, async function() {
        await GameServerMock.create({ isPersistent: true });

        expect(createNamespacedDeploymentStub.calledOnce).to.eql(true);
        expect(createNamespacedServiceStub.calledOnce).to.eql(true);

        expect(deleteNamespacedDeploymentStub.calledOnce).to.eql(true);
        expect(deleteNamespacedPodStub.calledOnce).to.eql(true);
        expect(deleteNamespacedServiceStub.calledOnce).to.eql(true);

        expect(patchNamespacedConfigMapStub.calledTwice).to.eql(true);
        expect(patchNamespacedServiceStub.calledOnce).to.eql(true);
      });
    });

    context('when not persistent', function() {
      it(`creates Kubernetes resources`, async function() {
        await GameServerMock.create();

        expect(createNamespacedPodStub.calledOnce).to.eql(true);
        expect(createNamespacedServiceStub.calledOnce).to.eql(true);

        expect(deleteNamespacedDeploymentStub.calledOnce).to.eql(true);
        expect(deleteNamespacedPodStub.calledOnce).to.eql(true);
        expect(deleteNamespacedServiceStub.calledOnce).to.eql(true);

        expect(patchNamespacedConfigMapStub.calledTwice).to.eql(true);
        expect(patchNamespacedServiceStub.calledOnce).to.eql(true);
      });
    });
  });

  describe('deleteKubernetesResources()', function() {
    it(`removes created Kubernetes resources`, async function() {
      await GameServerMock.create();

      expect(deleteNamespacedDeploymentStub.calledOnce).to.eql(true);
      expect(deleteNamespacedPodStub.calledOnce).to.eql(true);
      expect(deleteNamespacedServiceStub.calledOnce).to.eql(true);
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

        expect(deleteNamespacedPodStub.calledTwice).to.eql(true);
        expect(deleteNamespacedPodStub.getCalls()[0].args[0]).to.eql(names[0]);
        expect(deleteNamespacedPodStub.getCalls()[1].args[0]).to.eql(names[1]);
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
