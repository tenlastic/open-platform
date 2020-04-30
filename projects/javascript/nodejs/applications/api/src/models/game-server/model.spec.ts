import * as k8s from '@kubernetes/client-node';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { GameServerMock } from './model.mock';

const chance = new Chance();
let createNamespacedDeploymentStub: sinon.SinonStub;
let createNamespacedServiceStub: sinon.SinonStub;
let deleteNamespacedDeploymentStub: sinon.SinonStub;
let deleteNamespacedServiceStub: sinon.SinonStub;
let patchNamespacedConfigMapStub: sinon.SinonStub;
let patchNamespacedServiceStub: sinon.SinonStub;
let sandbox: sinon.SinonSandbox;

beforeEach(async function() {
  sandbox = sinon.createSandbox();

  createNamespacedDeploymentStub = sandbox
    .stub(k8s.AppsV1Api.prototype, 'createNamespacedDeployment')
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

  deleteNamespacedDeploymentStub = sandbox
    .stub(k8s.AppsV1Api.prototype, 'deleteNamespacedDeployment')
    .resolves();
  deleteNamespacedServiceStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'deleteNamespacedService')
    .resolves();

  patchNamespacedConfigMapStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'patchNamespacedConfigMap')
    .resolves();
  patchNamespacedServiceStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'patchNamespacedService')
    .resolves();
});

afterEach(function() {
  sandbox.restore();
});

describe('models/game-server/model', function() {
  describe('createKubernetesResources()', function() {
    it(`sets the record's url`, async function() {
      const record = await GameServerMock.create({ releaseId: mongoose.Types.ObjectId() });

      expect(record.url).to.exist;
    });

    it(`creates Kubernetes resources`, async function() {
      await GameServerMock.create({ releaseId: mongoose.Types.ObjectId() });

      expect(createNamespacedDeploymentStub.calledOnce).to.eql(true);
      expect(createNamespacedServiceStub.calledOnce).to.eql(true);

      expect(deleteNamespacedDeploymentStub.calledOnce).to.eql(true);
      expect(deleteNamespacedServiceStub.calledOnce).to.eql(true);

      expect(patchNamespacedConfigMapStub.calledOnce).to.eql(true);
      expect(patchNamespacedServiceStub.calledOnce).to.eql(true);
    });
  });

  describe('deleteKubernetesResources()', function() {
    it(`removes created Kubernetes resources`, async function() {
      await GameServerMock.create({ releaseId: mongoose.Types.ObjectId() });

      expect(deleteNamespacedDeploymentStub.calledOnce).to.eql(true);
      expect(deleteNamespacedServiceStub.calledOnce).to.eql(true);
    });
  });
});
