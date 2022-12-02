import { expect } from 'chai';

import { AuthorizationModel, AuthorizationRole } from '../authorization';
import { AuthorizationRequestModel } from './model';

describe('models/authorization-request', function () {
  describe('mergeRoles()', function () {
    it('adds a new role', function () {
      const authorization = new AuthorizationModel({
        roles: [AuthorizationRole.AuthorizationsReadWrite],
      });
      const authorizationRequest = new AuthorizationRequestModel({
        roles: [AuthorizationRole.NamespacesReadWrite],
      });

      const result = authorizationRequest.mergeRoles(authorization);

      expect(result).to.eql([
        AuthorizationRole.AuthorizationsReadWrite,
        AuthorizationRole.NamespacesReadWrite,
      ]);
    });

    it('replaces an existing role with lower priority', function () {
      const authorization = new AuthorizationModel({
        roles: [AuthorizationRole.NamespacesRead],
      });
      const authorizationRequest = new AuthorizationRequestModel({
        roles: [AuthorizationRole.NamespacesReadWrite],
      });

      const result = authorizationRequest.mergeRoles(authorization);

      expect(result).to.eql([AuthorizationRole.NamespacesReadWrite]);
    });

    it('does not replace an existing role with higher priority', function () {
      const authorization = new AuthorizationModel({
        roles: [AuthorizationRole.NamespacesReadWrite],
      });
      const authorizationRequest = new AuthorizationRequestModel({
        roles: [AuthorizationRole.NamespacesRead],
      });

      const result = authorizationRequest.mergeRoles(authorization);

      expect(result).to.eql([AuthorizationRole.NamespacesReadWrite]);
    });
  });
});
