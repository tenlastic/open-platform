import { expect } from 'chai';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import { Namespace, NamespaceDocument, NamespaceRole } from './model';
import { NamespaceMock } from './model.mock';

describe('models/namespace/model', function () {
  describe('getAccessToken()', function () {
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceMock.create();
    });

    it('returns an accessToken', async function () {
      const roles = [NamespaceRole.Namespaces];
      const accessToken = Namespace.getAccessToken(namespace._id, roles);
      const { user } = jwt.decode(accessToken) as any;

      expect(accessToken).to.exist;
      expect(user.namespaceId).to.eql(namespace._id.toString());
      expect(user.roles).to.eql(roles);
    });
  });

  describe('getDefaultUsers()', function () {
    context('when the ACL is empty', function () {
      it('returns an array with the current user as an Namespace administrator', function () {
        const user = { _id: new mongoose.Types.ObjectId() };

        const result = Namespace.getDefaultUsers(null, user);

        expect(result.length).to.eql(1);
        expect(result[0].roles).to.eql([NamespaceRole.Namespaces]);
        expect(result[0]._id.toString()).to.eql(user._id.toHexString());
      });
    });

    context('when the ACL includes an Namespace administrator', function () {
      it('returns a copy of the original array', function () {
        const user = { _id: new mongoose.Types.ObjectId() };
        const acl = [{ _id: user._id, roles: [NamespaceRole.Namespaces] }];

        const result = Namespace.getDefaultUsers(acl, user);

        expect(result).to.eql(acl);
      });
    });

    context('when the ACL does not includes an Namespace administrator', function () {
      context('when the ACL includes the current user', function () {
        it('grants the Namespace administrator role to the current user', function () {
          const user = { _id: new mongoose.Types.ObjectId() };
          const acl = [{ _id: user._id, roles: ['Owner'] }];

          const result = Namespace.getDefaultUsers(acl, user);

          expect(result.length).to.eql(1);
          expect(result[0].roles).to.eql(['Owner', NamespaceRole.Namespaces]);
          expect(result[0]._id.toString()).to.eql(user._id.toHexString());
        });
      });

      context('when the ACL does not include the current user', function () {
        it('grants the Namespace administrator role to the current user', function () {
          const user = { _id: new mongoose.Types.ObjectId() };
          const acl = [{ _id: new mongoose.Types.ObjectId(), roles: ['Owner'] }];

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
