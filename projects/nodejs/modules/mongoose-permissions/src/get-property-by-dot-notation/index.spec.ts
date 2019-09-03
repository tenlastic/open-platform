import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { getPropertyByDotNotation } from './';

describe('get-property-by-dot-notation', function() {
  context('when the JSON is an array', function() {
    it('returns all values matching the given path', function() {
      const json = [
        { name: { first: 'first', last: 'last' } },
        { name: { first: 'first', last: 'last' } },
      ];
      const path = 'name.first';

      const result = getPropertyByDotNotation(json, path);

      expect(result).to.eql(['first', 'first']);
    });

    it('does not return null or undefined values', function() {
      const json = [{ name: { first: 'first' } }, { name: { last: 'last' } }];
      const path = 'name.first';

      const result = getPropertyByDotNotation(json, path);

      expect(result).to.eql(['first']);
    });
  });

  context('when the JSON is an object', function() {
    it('returns the value matching the given path', function() {
      const json = {
        accessControlList: [
          { roles: ['Administrator'], userId: mongoose.Types.ObjectId() },
          { roles: ['Administrator'], userId: mongoose.Types.ObjectId() },
        ],
      };
      const path = 'accessControlList.userId';

      const result = getPropertyByDotNotation(json, path);

      expect(result).to.eql([json.accessControlList[0].userId, json.accessControlList[1].userId]);
    });

    it('returns null when the matching property is not found', function() {
      const json = { key: 'key' };
      const path = 'value';

      const result = getPropertyByDotNotation(json, path);

      expect(result).to.eql(null);
    });
  });

  context('when the JSON is a primitive value', function() {
    it('returns null', function() {
      const json = 5;
      const path = 'value';

      const result = getPropertyByDotNotation(json, path);

      expect(result).to.eql(null);
    });
  });
});
