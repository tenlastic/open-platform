import { expect } from 'chai';
import * as Chance from 'chance';

import { UserModel } from '../models';

const chance = new Chance();

describe('users', function() {
  afterEach(async function() {
    await UserModel.deleteAll();
  });

  it('creates a user', async function() {
    const params = {
      email: chance.email(),
      password: chance.hash(),
      username: chance.hash({ length: 20 }),
    };

    const res = await UserModel.create(params);

    expect(res.statusCode).to.eql(200);
    expect(res.body.record.email).to.eql(params.email.toLowerCase());
    expect(res.body.record.password).to.not.exist;
    expect(res.body.record.username).to.eql(params.username);
  });

  describe('working with an existing user', function() {
    let record: any;

    beforeEach(async function() {
      const res = await UserModel.create();
      record = res.body.record;
    });

    it('finds the user', async function() {
      const res = await UserModel.findOne({ _id: record._id });

      expect(res.statusCode).to.eql(200);
      expect(res.body.record.name).to.eql(record.name);
    });

    it('updates the user', async function() {
      const email = chance.email();

      const res = await UserModel.update({ _id: record._id, email });

      expect(res.statusCode).to.eql(200);
      expect(res.body.record.email).to.eql(email.toLowerCase());
    });

    it('deletes the user', async function() {
      const del = await UserModel.delete({ _id: record._id });

      expect(del.statusCode).to.eql(200);
    });
  });
});
