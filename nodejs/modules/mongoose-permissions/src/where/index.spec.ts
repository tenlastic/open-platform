import { expect } from 'chai';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { where } from './';

const chance = new Chance();

const Schema = new mongoose.Schema({ name: String });
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>(chance.hash(), Schema);

const permissions = {
  find: {
    admin: {},
  },
  roles: {
    admin: { 'authorization.roles': 'Admin' },
    default: {},
  },
};

describe('where', function () {
  context('when user is an admin', function () {
    it('returns a valid where query', async function () {
      const context = {
        credentials: { authorization: { roles: ['Admin'] } },
        Model,
        options: permissions,
      };

      const results = await where(context, {});

      expect(results).to.eql({ $and: [{ $or: [{}] }, {}] });
    });
  });

  context('when user is not an admin', function () {
    it('returns null', async function () {
      it('returns all the records', async function () {
        const context = {
          credentials: { authorization: { roles: [] } },
          Model,
          options: permissions,
        };

        const results = await where(context, {});

        expect(results).to.eql(null);
      });
    });
  });
});
