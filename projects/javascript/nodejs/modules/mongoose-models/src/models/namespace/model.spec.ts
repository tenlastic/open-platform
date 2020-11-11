import * as k8s from '@kubernetes/client-node';
import { expect } from 'chai';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { Namespace, NamespaceRole } from './model';

let createNamespaceStub: sinon.SinonStub;
let deleteNamespaceStub: sinon.SinonStub;
let sandbox: sinon.SinonSandbox;

beforeEach(function() {
  sandbox = sinon.createSandbox();

  createNamespaceStub = sandbox.stub(k8s.CoreV1Api.prototype, 'createNamespace').resolves();
  deleteNamespaceStub = sandbox.stub(k8s.CoreV1Api.prototype, 'deleteNamespace').resolves();
});

afterEach(function() {
  sandbox.restore();
});

describe('models/namespace/model', function() {
  describe('getDefaultUsers()', function() {
    context('when the ACL is empty', function() {
      it('returns an array with the current user as an Namespace administrator', function() {
        const user = { _id: mongoose.Types.ObjectId() };

        const result = Namespace.getDefaultUsers(null, user);

        expect(result.length).to.eql(1);
        expect(result[0].roles).to.eql([NamespaceRole.Namespaces]);
        expect(result[0]._id.toString()).to.eql(user._id.toHexString());
      });
    });

    context('when the ACL includes an Namespace administrator', function() {
      it('returns a copy of the original array', function() {
        const user = { _id: mongoose.Types.ObjectId() };
        const acl = [{ _id: user._id, roles: [NamespaceRole.Namespaces] }];

        const result = Namespace.getDefaultUsers(acl, user);

        expect(result).to.eql(acl);
      });
    });

    context('when the ACL does not includes an Namespace administrator', function() {
      context('when the ACL includes the current user', function() {
        it('grants the Namespace administrator role to the current user', function() {
          const user = { _id: mongoose.Types.ObjectId() };
          const acl = [{ _id: user._id, roles: ['Owner'] }];

          const result = Namespace.getDefaultUsers(acl, user);

          expect(result.length).to.eql(1);
          expect(result[0].roles).to.eql(['Owner', NamespaceRole.Namespaces]);
          expect(result[0]._id.toString()).to.eql(user._id.toHexString());
        });
      });

      context('when the ACL does not include the current user', function() {
        it('grants the Namespace administrator role to the current user', function() {
          const user = { _id: mongoose.Types.ObjectId() };
          const acl = [{ _id: mongoose.Types.ObjectId(), roles: ['Owner'] }];

          const result = Namespace.getDefaultUsers(acl, user);

          expect(result.length).to.eql(2);

          expect(result[0].roles).to.eql(['Owner']);
          expect(result[0]._id.toString()).to.eql(acl[0]._id.toHexString());

          expect(result[1].roles).to.eql([NamespaceRole.Namespaces]);
          expect(result[1]._id.toString()).to.eql(user._id.toHexString());
        });
      });
    });
  });
});
