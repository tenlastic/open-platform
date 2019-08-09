import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { request } from './request';

const chance = new Chance();

describe('databases', function() {
  it('creates, finds, updates, and deletes a database', async function() {
    const user = { activatedAt: new Date(), roles: ['Admin'] };

    // Create a new Database.
    const initialName = chance.hash();
    const post = await request(
      'post',
      '/databases',
      { name: initialName, userId: mongoose.Types.ObjectId() },
      user,
    );
    expect(post.statusCode).to.eql(200);
    expect(post.body.record.name).to.eql(initialName);

    // Find the Database.
    const get = await request('get', `/databases/${post.body.record._id}`, null, user);
    expect(get.statusCode).to.eql(200);
    expect(get.body.record.name).to.eql(initialName);

    // Update the Database.
    const newName = chance.hash();
    const update = await request(
      'put',
      `/databases/${post.body.record._id}`,
      { name: newName },
      user,
    );
    expect(update.statusCode).to.eql(200);
    expect(update.body.record.name).to.eql(newName);

    // Delete the Database.
    const del = await request('delete', `/databases/${post.body.record._id}`, null, user);
    expect(del.statusCode).to.eql(200);
  });
});
