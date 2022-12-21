import { expect } from 'chai';

import { AuthorizationModel, AuthorizationRole } from '../authorization';
import { AuthorizationRequestModel } from './model';

describe('models/authorization-request', function () {
  describe('mergeRoles()', function () {
    it('adds a new role', function () {
      const authorization = new AuthorizationModel({
        roles: [AuthorizationRole.AuthorizationsRead, AuthorizationRole.AuthorizationsWrite],
      });
      const authorizationRequest = new AuthorizationRequestModel({
        roles: [AuthorizationRole.NamespacesRead, AuthorizationRole.NamespacesWrite],
      });

      const result = authorizationRequest.mergeRoles(authorization);

      expect(result).to.eql([
        AuthorizationRole.AuthorizationsRead,
        AuthorizationRole.AuthorizationsWrite,
        AuthorizationRole.NamespacesRead,
        AuthorizationRole.NamespacesWrite,
      ]);
    });

    it('replaces an existing role with lower priority', function () {
      const authorization = new AuthorizationModel({
        roles: [AuthorizationRole.NamespacesRead],
      });
      const authorizationRequest = new AuthorizationRequestModel({
        roles: [AuthorizationRole.NamespacesRead, AuthorizationRole.NamespacesWrite],
      });

      const result = authorizationRequest.mergeRoles(authorization);

      expect(result).to.eql([AuthorizationRole.NamespacesRead, AuthorizationRole.NamespacesWrite]);
    });

    it('does not replace an existing role with higher priority', function () {
      const authorization = new AuthorizationModel({
        roles: [AuthorizationRole.NamespacesRead, AuthorizationRole.NamespacesWrite],
      });
      const authorizationRequest = new AuthorizationRequestModel({
        roles: [AuthorizationRole.NamespacesRead],
      });

      const result = authorizationRequest.mergeRoles(authorization);

      expect(result).to.eql([AuthorizationRole.NamespacesRead, AuthorizationRole.NamespacesWrite]);
    });
  });
});
