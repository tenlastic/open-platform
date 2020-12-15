import * as k8s from '@kubernetes/client-node';
import * as sinon from 'sinon';

let createNamespacedCustomObjectStub: sinon.SinonStub;
let deleteNamespacedCustomObjectStub: sinon.SinonStub;
let sandbox: sinon.SinonSandbox;

beforeEach(function() {
  sandbox = sinon.createSandbox();

  createNamespacedCustomObjectStub = sandbox
    .stub(k8s.CustomObjectsApi.prototype, 'createNamespacedCustomObject')
    .resolves();
  deleteNamespacedCustomObjectStub = sandbox
    .stub(k8s.CustomObjectsApi.prototype, 'deleteNamespacedCustomObject')
    .resolves();
});

afterEach(function() {
  sandbox.restore();
});
