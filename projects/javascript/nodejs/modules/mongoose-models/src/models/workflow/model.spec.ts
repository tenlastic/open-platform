import * as k8s from '@kubernetes/client-node';
import * as sinon from 'sinon';

let createNamespacedCustomObjectStub: sinon.SinonStub;
let createNamespacedNetworkPolicyStub: sinon.SinonStub;
let createNamespacedRoleBindingStub: sinon.SinonStub;
let createNamespacedRoleStub: sinon.SinonStub;
let createNamespacedServiceAccountStub: sinon.SinonStub;
let deleteNamespacedCustomObjectStub: sinon.SinonStub;
let deleteNamespacedNetworkPolicyStub: sinon.SinonStub;
let deleteNamespacedRoleStub: sinon.SinonStub;
let deleteNamespacedRoleBindingStub: sinon.SinonStub;
let deleteNamespacedServiceAccountStub: sinon.SinonStub;
let sandbox: sinon.SinonSandbox;

beforeEach(function() {
  sandbox = sinon.createSandbox();

  createNamespacedCustomObjectStub = sandbox
    .stub(k8s.CustomObjectsApi.prototype, 'createNamespacedCustomObject')
    .resolves();
  createNamespacedNetworkPolicyStub = sandbox
    .stub(k8s.NetworkingV1Api.prototype, 'createNamespacedNetworkPolicy')
    .resolves();
  createNamespacedRoleStub = sandbox
    .stub(k8s.RbacAuthorizationV1Api.prototype, 'createNamespacedRole')
    .resolves();
  createNamespacedRoleBindingStub = sandbox
    .stub(k8s.RbacAuthorizationV1Api.prototype, 'createNamespacedRoleBinding')
    .resolves();
  createNamespacedServiceAccountStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'createNamespacedServiceAccount')
    .resolves();

  deleteNamespacedCustomObjectStub = sandbox
    .stub(k8s.CustomObjectsApi.prototype, 'deleteNamespacedCustomObject')
    .resolves();
  deleteNamespacedNetworkPolicyStub = sandbox
    .stub(k8s.NetworkingV1Api.prototype, 'deleteNamespacedNetworkPolicy')
    .resolves();
  deleteNamespacedRoleStub = sandbox
    .stub(k8s.RbacAuthorizationV1Api.prototype, 'deleteNamespacedRole')
    .resolves();
  deleteNamespacedRoleBindingStub = sandbox
    .stub(k8s.RbacAuthorizationV1Api.prototype, 'deleteNamespacedRoleBinding')
    .resolves();
  deleteNamespacedServiceAccountStub = sandbox
    .stub(k8s.CoreV1Api.prototype, 'deleteNamespacedServiceAccount')
    .resolves();
});

afterEach(function() {
  sandbox.restore();
});
