import { expect } from 'chai';
import * as mongoose from 'mongoose';

import { QueueMock } from './model.mock';
import { Queue, QueueDocument } from './model';
import { UserDocument } from 'applications/api/dist/models';

describe('models/queue/model', function() {
  describe('createMatch()', function() {
    let queue: QueueDocument;

    beforeEach(async function() {
      queue = await QueueMock.create({ playersPerTeam: 1, teams: 2 });
    });

    context('when enough users are in-queue', function() {
      let firstQueueMember: 
      it('creates a new Match', async function() {

      });

      it('deletes matched QueueMembers', async function() {});
    });

    context('when not enough users are in-queue', function() {
      it('does not create a new match', async function() {});
    });
  });
});
