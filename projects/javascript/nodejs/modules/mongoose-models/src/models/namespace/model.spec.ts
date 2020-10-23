import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { Namespace, NamespaceRole } from './model';

describe('models/namespace/model', function() {
  describe('getDefaultUsers()', function() {
    context('when the ACL is empty', function() {
      it('returns an array with the current user as an Administrator', function() {
        const user = { _id: mongoose.Types.ObjectId() };

        const result = Namespace.getDefaultUsers(null, user);

        expect(result.length).to.eql(1);
        expect(result[0].roles).to.eql([NamespaceRole.Namespaces]);
        expect(result[0]._id.toString()).to.eql(user._id.toHexString());
      });
    });

    context('when the ACL includes an Administrator', function() {
      it('returns a copy of the original array', function() {
        const user = { _id: mongoose.Types.ObjectId() };
        const acl = [{ _id: user._id, roles: [NamespaceRole.Namespaces] }];

        const result = Namespace.getDefaultUsers(acl, user);

        expect(result).to.eql(acl);
      });
    });

    context('when the ACL does not includes an Administrator', function() {
      context('when the ACL includes the current user', function() {
        it('grants the Administrator role to the current user', function() {
          const user = { _id: mongoose.Types.ObjectId() };
          const acl = [{ _id: user._id, roles: ['Owner'] }];

          const result = Namespace.getDefaultUsers(acl, user);

          expect(result.length).to.eql(1);
          expect(result[0].roles).to.eql(['Owner', NamespaceRole.Namespaces]);
          expect(result[0]._id.toString()).to.eql(user._id.toHexString());
        });
      });

      context('when the ACL does not include the current user', function() {
        it('grants the Administrator role to the current user', function() {
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
