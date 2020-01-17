import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { isJsonValid } from './';

describe('is-json-valid', function() {
  describe('isJsonValid()', function() {
    describe('$and', function() {
      it('returns true', function() {
        const json = {
          user: {
            age: 5,
            name: 'Test User',
          },
        };
        const query = {
          $and: [{ 'user.age': { $eq: 5 } }, { 'user.name': { $eq: 'Test User' } }],
        };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function() {
        const json = {
          user: {
            age: 5,
            name: 'Test User',
          },
        };
        const query = {
          $and: [{ 'user.age': { $eq: 1 } }, { 'user.name': { $eq: 'Test User' } }],
        };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    describe('$elemMatch', function() {
      it('returns true', function() {
        const json = {
          user: {
            names: [{ first: 'first', last: 'first' }, { first: 'second', last: 'second' }],
          },
        };
        const query = {
          'user.names': {
            $elemMatch: {
              first: { $eq: 'first' },
              last: { $eq: 'first' },
            },
          },
        };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function() {
        const json = {
          user: {
            names: [{ first: 'first', last: 'first' }, { first: 'second', last: 'second' }],
          },
        };
        const query = {
          'user.names': {
            $elemMatch: {
              first: { $eq: 'first' },
              last: { $eq: 'second' },
            },
          },
        };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });

    describe('$eq', function() {
      context('when the reference is an array', function() {
        it('returns true', function() {
          const json = {
            user: {
              roles: ['Admin'],
            },
          };
          const query = {
            'user.roles': { $eq: 'Admin' },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function() {
          const json = {
            user: {
              roles: ['Admin'],
            },
          };
          const query = {
            'user.roles': { $eq: 'Owner' },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });

      context('when the reference is an ObjectId', function() {
        it('returns true', function() {
          const json = {
            user: {
              _id: mongoose.Types.ObjectId(),
            },
          };
          const query = {
            'user._id': { $eq: json.user._id.toHexString() },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function() {
          const json = {
            user: {
              _id: mongoose.Types.ObjectId(),
            },
          };
          const query = {
            'user._id': { $eq: mongoose.Types.ObjectId() },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });

      context('when the reference is anything else', function() {
        it('returns true', function() {
          const json = {
            user: {
              _id: '123',
            },
          };
          const query = {
            'user._id': { $eq: '123' },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function() {
          const json = {
            user: {
              _id: '123',
            },
          };
          const query = {
            'user._id': { $eq: '1' },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });
    });

    describe('$exists', function() {
      context('when value is true', function() {
        it('returns true', function() {
          const json = {
            user: {
              roles: ['Admin'],
            },
          };
          const query = {
            'user.roles': { $exists: true },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function() {
          const json = {
            user: {},
          };
          const query = {
            'user.roles': { $exists: true },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });

      context('when value is false', function() {
        it('returns true', function() {
          const json = {
            user: {},
          };
          const query = {
            'user.roles': { $exists: false },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function() {
          const json = {
            user: {
              roles: ['Admin'],
            },
          };
          const query = {
            'user.roles': { $exists: false },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });
    });

    describe('$in', function() {
      context('when the reference is an array', function() {
        it('returns true', function() {
          const json = {
            user: {
              roles: ['Admin'],
            },
          };
          const query = {
            'user.roles': { $in: ['Admin', 'Owner'] },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function() {
          const json = {
            user: {
              roles: ['Admin'],
            },
          };
          const query = {
            'user.roles': { $in: ['Owner'] },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });

      context('when the reference is an ObjectId', function() {
        it('returns true', function() {
          const json = {
            user: {
              _id: mongoose.Types.ObjectId(),
            },
          };
          const query = {
            'user._id': { $in: [json.user._id.toHexString()] },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function() {
          const json = {
            user: {
              _id: mongoose.Types.ObjectId(),
            },
          };
          const query = {
            'user._id': { $in: [mongoose.Types.ObjectId()] },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });

      context('when the reference is anything else', function() {
        it('returns true', function() {
          const json = {
            user: {
              _id: '123',
            },
          };
          const query = {
            'user._id': { $in: ['123'] },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(true);
        });

        it('returns false', function() {
          const json = {
            user: {
              _id: '123',
            },
          };
          const query = {
            'user._id': { $in: [123] },
          };

          const result = isJsonValid(json, query);

          expect(result).to.eql(false);
        });
      });
    });

    describe('$or', function() {
      it('returns true', function() {
        const json = {
          user: {
            age: 5,
            name: 'Test User',
          },
        };
        const query = {
          $or: [{ 'user.age': { $eq: 1 } }, { 'user.name': { $eq: 'Test User' } }],
        };

        const result = isJsonValid(json, query, false);

        expect(result).to.eql(true);
      });

      it('returns false', function() {
        const json = {
          user: {
            age: 5,
            name: 'Test User',
          },
        };
        const query = {
          $or: [{ 'user.age': { $eq: 1 } }, { 'user.name': { $eq: 'Another User' } }],
        };

        const result = isJsonValid(json, query, false);

        expect(result).to.eql(false);
      });
    });

    describe('inferred value', function() {
      it('returns true', function() {
        const json = {
          record: {
            userId: '123',
          },
          user: {
            _id: '123',
          },
        };
        const query = {
          'record.userId': { $eq: { $ref: 'user._id' } },
        };

        const result = isJsonValid(json, query);

        expect(result).to.eql(true);
      });

      it('returns false', function() {
        const json = {
          record: {
            userId: '123',
          },
          user: {
            _id: '12345',
          },
        };
        const query = {
          'record.userId': { $eq: { $ref: 'user._id' } },
        };

        const result = isJsonValid(json, query);

        expect(result).to.eql(false);
      });
    });
  });
});
