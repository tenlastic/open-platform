import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { isJsonValid } from './';

describe('is-json-valid', function () {
  describe('$and', function () {
    it('returns true', function () {
      const json = { user: { age: 5, name: 'Test User' } };
      const query = { $and: [{ 'user.age': { $eq: 5 } }, { 'user.name': { $eq: 'Test User' } }] };

      const result = isJsonValid(json, query);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const json = { user: { age: 5, name: 'Test User' } };
      const query = { $and: [{ 'user.age': { $eq: 1 } }, { 'user.name': { $eq: 'Test User' } }] };

      const result = isJsonValid(json, query);

      expect(result).to.eql(false);
    });
  });

  describe('$elemMatch', function () {
    it('returns true', function () {
      const json = {
        user: {
          names: [
            { first: 'first', last: 'first' },
            { first: 'second', last: 'second' },
          ],
        },
      };
      const query = {
        'user.names': { $elemMatch: { first: { $eq: 'first' }, last: { $eq: 'first' } } },
      };

      const result = isJsonValid(json, query);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const json = {
        user: {
          names: [
            { first: 'first', last: 'first' },
            { first: 'second', last: 'second' },
          ],
        },
      };
      const query = {
        'user.names': { $elemMatch: { first: { $eq: 'first' }, last: { $eq: 'second' } } },
      };

      const result = isJsonValid(json, query);

      expect(result).to.eql(false);
    });
  });

  describe('$eq', function () {
    context('when the reference is an array', function () {
      context('when the reference is a nested array and the value is an array', function () {
        it('returns true', function () {
          const json = { user: { roles: [{ name: ['Admin'] }] } };
          const query = { 'user.roles.name': { $eq: ['Admin'] } };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function () {
          const json = { user: { roles: [{ name: ['Admin', 'Owner'] }] } };
          const query = { 'user.roles.name': { $eq: ['Owner'] } };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });

      context('when the reference is not a nested array and the value is an array', function () {
        it('returns true', function () {
          const json = { user: { roles: ['Admin'] } };
          const query = { 'user.roles': { $eq: ['Admin'] } };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function () {
          const json = { user: { roles: ['Admin', 'Owner'] } };
          const query = { 'user.roles': { $eq: ['Owner'] } };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });

      context('when the value is not an array', function () {
        it('returns true', function () {
          const json = { user: { roles: ['Admin'] } };
          const query = { 'user.roles': { $eq: 'Admin' } };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function () {
          const json = { user: { roles: ['Admin'] } };
          const query = { 'user.roles': { $eq: 'Owner' } };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });
    });

    context('when the reference is an ObjectId', function () {
      it('returns true', function () {
        const json = { user: { _id: new mongoose.Types.ObjectId() } };
        const query = { 'user._id': { $eq: json.user._id.toHexString() } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: new mongoose.Types.ObjectId() } };
        const query = { 'user._id': { $eq: new mongoose.Types.ObjectId() } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is anything else', function () {
      it('returns true', function () {
        const json = { user: { _id: '123' } };
        const query = { 'user._id': { $eq: '123' } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: '123' } };
        const query = { 'user._id': { $eq: '1' } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });
  });

  describe('$exists', function () {
    context('when value is true', function () {
      it('returns true', function () {
        const json = { user: { roles: ['Admin'] } };
        const query = { 'user.roles': { $exists: true } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: {} };
        const query = { 'user.roles': { $exists: true } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when value is false', function () {
      it('returns true', function () {
        const json = { user: {} };
        const query = { 'user.roles': { $exists: false } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { roles: ['Admin'] } };
        const query = { 'user.roles': { $exists: false } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });
  });

  describe('$gt', function () {
    context('when the reference is a Date', function () {
      it('returns true', function () {
        const json = { user: { createdAt: new Date(1) } };
        const query = { 'user.createdAt': { $gt: new Date(0) } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { createdAt: new Date(0) } };
        const query = { 'user.createdAt': { $gt: new Date(1) } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is anything else', function () {
      it('returns true', function () {
        const json = { user: { _id: 1 } };
        const query = { 'user._id': { $gt: 0 } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: 0 } };
        const query = { 'user._id': { $gt: 1 } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });
  });

  describe('$gte', function () {
    context('when the reference is a Date', function () {
      it('returns true', function () {
        const json = { user: { createdAt: new Date(0) } };
        const query = { 'user.createdAt': { $gte: new Date(0) } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { createdAt: new Date(0) } };
        const query = { 'user.createdAt': { $gte: new Date(1) } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is anything else', function () {
      it('returns true', function () {
        const json = { user: { _id: 0 } };
        const query = { 'user._id': { $gte: 0 } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: 0 } };
        const query = { 'user._id': { $gte: 1 } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });
  });

  describe('$in', function () {
    context('when the reference is an array', function () {
      it('returns true', function () {
        const json = { user: { roles: ['Admin'] } };
        const query = { 'user.roles': { $in: ['Admin', 'Owner'] } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { roles: ['Admin'] } };
        const query = { 'user.roles': { $in: ['Owner'] } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is an ObjectId', function () {
      it('returns true', function () {
        const json = { user: { _id: new mongoose.Types.ObjectId() } };
        const query = { 'user._id': { $in: [json.user._id] } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: new mongoose.Types.ObjectId() } };
        const query = { 'user._id': { $in: [new mongoose.Types.ObjectId()] } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is anything else', function () {
      it('returns true', function () {
        const json = { user: { _id: '123' } };
        const query = { 'user._id': { $in: ['123'] } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: '123' } };
        const query = { 'user._id': { $in: [123] } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });
  });

  describe('$lt', function () {
    context('when the reference is a Date', function () {
      it('returns true', function () {
        const json = { user: { createdAt: new Date(0) } };
        const query = { 'user.createdAt': { $lt: new Date(1) } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { createdAt: new Date(1) } };
        const query = { 'user.createdAt': { $lt: new Date(0) } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is anything else', function () {
      it('returns true', function () {
        const json = { user: { _id: 0 } };
        const query = { 'user._id': { $lt: 1 } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: 1 } };
        const query = { 'user._id': { $lt: 0 } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });
  });

  describe('$lte', function () {
    context('when the reference is a Date', function () {
      it('returns true', function () {
        const json = { user: { createdAt: new Date(0) } };
        const query = { 'user.createdAt': { $lte: new Date(0) } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { createdAt: new Date(1) } };
        const query = { 'user.createdAt': { $lte: new Date(0) } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is anything else', function () {
      it('returns true', function () {
        const json = { user: { _id: 0 } };
        const query = { 'user._id': { $lte: 0 } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: 1 } };
        const query = { 'user._id': { $lte: 0 } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });
  });

  describe('$ne', function () {
    context('when the reference is an array', function () {
      context('when the reference is a nested array and the value is an array', function () {
        it('returns true', function () {
          const json = { user: { roles: [{ name: ['Admin', 'Owner'] }] } };
          const query = { 'user.roles.name': { $ne: ['Admin'] } };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function () {
          const json = { user: { roles: [{ name: ['Admin'] }] } };
          const query = { 'user.roles.name': { $ne: ['Admin'] } };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });

      context('when the reference is not a nested array and the value is an array', function () {
        it('returns true', function () {
          const json = { user: { roles: ['Admin', 'Owner'] } };
          const query = { 'user.roles': { $ne: ['Admin'] } };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function () {
          const json = { user: { roles: ['Admin'] } };
          const query = { 'user.roles': { $ne: ['Admin'] } };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });

      context('when the value is not an array', function () {
        it('returns true', function () {
          const json = { user: { roles: ['Admin'] } };
          const query = { 'user.roles': { $ne: 'Owner' } };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function () {
          const json = { user: { roles: ['Admin'] } };
          const query = { 'user.roles': { $ne: 'Admin' } };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });
    });

    context('when the reference is an ObjectId', function () {
      it('returns true', function () {
        const json = { user: { _id: new mongoose.Types.ObjectId() } };
        const query = { 'user._id': { $ne: new mongoose.Types.ObjectId() } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: new mongoose.Types.ObjectId() } };
        const query = { 'user._id': { $ne: json.user._id.toHexString() } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is anything else', function () {
      it('returns true', function () {
        const json = { user: { _id: '123' } };
        const query = { 'user._id': { $ne: '1' } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: '123' } };
        const query = { 'user._id': { $ne: '123' } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });
  });

  describe('$nin', function () {
    context('when the reference is an array', function () {
      it('returns true', function () {
        const json = { user: { roles: ['Admin'] } };
        const query = { 'user.roles': { $nin: ['Owner'] } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { roles: ['Admin'] } };
        const query = { 'user.roles': { $nin: ['Admin', 'Owner'] } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is an ObjectId', function () {
      it('returns true', function () {
        const json = { user: { _id: new mongoose.Types.ObjectId() } };
        const query = { 'user._id': { $nin: [new mongoose.Types.ObjectId()] } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: new mongoose.Types.ObjectId() } };
        const query = { 'user._id': { $nin: [json.user._id] } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is anything else', function () {
      it('returns true', function () {
        const json = { user: { _id: '123' } };
        const query = { 'user._id': { $nin: [123] } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: '123' } };
        const query = { 'user._id': { $nin: ['123'] } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });
  });

  describe('$not', function () {
    it('returns true', function () {
      const json = {
        user: {
          names: [
            { first: 'first', last: 'first' },
            { first: 'second', last: 'second' },
          ],
        },
      };
      const query = {
        'user.names': {
          $not: { $elemMatch: { first: { $eq: 'first' }, last: { $eq: 'second' } } },
        },
      };

      const result = isJsonValid(json, query);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const json = {
        user: {
          names: [
            { first: 'first', last: 'first' },
            { first: 'second', last: 'second' },
          ],
        },
      };
      const query = {
        'user.names': {
          $not: { $elemMatch: { first: { $eq: 'first' }, last: { $eq: 'first' } } },
        },
      };

      const result = isJsonValid(json, query);

      expect(result).to.eql(false);
    });
  });

  describe('$or', function () {
    it('returns true', function () {
      const json = { user: { age: 5, name: 'Test User' } };
      const query = { $or: [{ 'user.age': { $eq: 1 } }, { 'user.name': { $eq: 'Test User' } }] };

      const result = isJsonValid(json, query);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const json = { user: { age: 5, name: 'Test User' } };
      const query = {
        $or: [{ 'user.age': { $eq: 1 } }, { 'user.name': { $eq: 'Another User' } }],
      };

      const result = isJsonValid(json, query);

      expect(result).to.eql(false);
    });
  });

  describe('$regex', function () {
    context('when the reference is a string', function () {
      it('returns true', function () {
        const json = { user: { name: 'valid name' } };
        const query = { 'user.name': { $regex: 'valid' } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { name: 'invalid name' } };
        const query = { 'user.name': { $regex: '^invalid$' } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is anything else', function () {
      it('returns false', function () {
        const json = { user: { name: null } };
        const query = { 'user.name': { $regex: 'valid' } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });

      it('returns false', function () {
        const json = { user: { name: 0 } };
        const query = { 'user.name': { $regex: '^invalid$' } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });
  });

  describe('$type', function () {
    context('when the reference is a string', function () {
      it('returns true', function () {
        const json = { user: { name: 'valid' } };
        const query = { 'user.name': { $type: 'string' } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { name: 'invalid' } };
        const query = { 'user.name': { $type: 'null' } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is anything else', function () {
      it('returns true', function () {
        const json = { user: { name: 'valid' } };
        const query = { 'user.name': { $type: String } };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });
    });
  });

  describe('inferred value', function () {
    it('returns true', function () {
      const json = { record: { userId: '123' }, user: { _id: '123' } };
      const query = { 'record.userId': { $eq: { $ref: 'user._id' } } };

      const result = isJsonValid(json, query);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const json = { record: { userId: '123' }, user: { _id: '12345' } };
      const query = { 'record.userId': { $eq: { $ref: 'user._id' } } };

      const result = isJsonValid(json, query);

      expect(result).to.eql(false);
    });
  });

  describe('default', function () {
    context('when the reference is an array', function () {
      it('returns true', function () {
        const json = { user: { roles: ['Admin'] } };
        const query = { 'user.roles': 'Admin' };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { roles: ['Admin'] } };
        const query = { 'user.roles': 'Owner' };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is an ObjectId', function () {
      it('returns true', function () {
        const json = { user: { _id: new mongoose.Types.ObjectId() } };
        const query = { 'user._id': json.user._id.toHexString() };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: new mongoose.Types.ObjectId() } };
        const query = { 'user._id': new mongoose.Types.ObjectId() };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    context('when the reference is anything else', function () {
      it('returns true', function () {
        const json = { user: { _id: '123' } };
        const query = { 'user._id': '123' };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns true', function () {
        const json = { user: { _id: '123' } };
        const query = { 'user._id': '123' };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function () {
        const json = { user: { _id: '123' } };
        const query = { 'user._id': '1' };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });
  });

  describe('empty', function () {
    it('returns true', function () {
      const json = { user: { age: 5, name: 'Test User' } };
      const query = { $and: [{ $or: [{}] }, {}] };

      const result = isJsonValid(json, query);

      expect(result).to.eql(true);
    });
  });

  describe('multiple operators', function () {
    it('returns true', function () {
      const json = { user: { age: 5, name: 'Test User' } };
      const query = { 'user.age': { $exists: true } };

      const result = isJsonValid(json, query);

      expect(result).to.eql(true);
    });

    it('returns false', function () {
      const json = { user: { age: 5, name: 'Test User' } };
      const query = { 'user.age': { $exists: true, $ne: 5 } };

      const result = isJsonValid(json, query);

      expect(result).to.eql(false);
    });
  });
});
