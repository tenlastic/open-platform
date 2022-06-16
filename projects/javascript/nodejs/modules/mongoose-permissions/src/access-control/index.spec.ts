import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { AccessControl } from './';

describe('access-control', function () {
  describe(`['getRole']()`, function () {
    let accessControl: AccessControl;

    beforeEach(function () {
      accessControl = new AccessControl({
        roles: [
          {
            name: 'admin',
            query: { 'user.roles': { $eq: 'Admin' } },
          },
          {
            name: 'owner',
            query: { 'record.userId': { $eq: { $ref: 'user._id' } } },
          },
        ],
      });
    });

    it('returns the first role', function () {
      const result = accessControl['getRole']({}, { roles: ['Admin'] });

      expect(result).to.eql('admin');
    });

    it('returns the second role', function () {
      const _id = new mongoose.Types.ObjectId();
      const result = accessControl['getRole']({ userId: _id }, { _id });

      expect(result).to.eql('owner');
    });

    it('returns default', function () {
      const _id = new mongoose.Types.ObjectId();
      const result = accessControl['getRole'](
        { userId: new mongoose.Types.ObjectId() },
        {
          _id,
        },
      );

      expect(result).to.eql('default');
    });
  });
});
