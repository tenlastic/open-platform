import * as kafka from '@tenlastic/kafka';
import { IDatabasePayload } from '@tenlastic/mongoose-change-stream';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { publish } from '../publish';
import { subscribe } from './';

const chance = new Chance();

const schema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  name: String,
  updatedAt: Date,
});
const Model = mongoose.model('example', schema);

describe('subscribe()', function() {
  let connection: kafka.Kafka;

  before(function() {
    connection = kafka.getConnection();
  });

  beforeEach(async function() {
    await Model.deleteMany({});
  });

  context('when the operationType is delete', function() {
    it('deletes the document from MongoDB', async function() {
      const record = await Model.create({ _id: mongoose.Types.ObjectId() });
      const payload: IDatabasePayload<any> = {
        documentKey: { _id: record._id },
        ns: { coll: chance.hash({ length: 16 }), db: chance.hash({ length: 16 }) },
        operationType: 'delete',
      };

      const { coll, db } = payload.ns;
      const topic = `${db}.${coll}`;

      subscribe(Model, { group: chance.hash(), topic });

      await publish(payload);

      // Wait for message to be published.
      await new Promise<void>(async resolve => {
        const consumer = connection.consumer({ groupId: `${chance.hash()}-${topic}` });
        await consumer.connect();

        await consumer.subscribe({ fromBeginning: true, topic });
        await consumer.run({ eachMessage: async () => resolve() });
      });
      await new Promise(resolve => setTimeout(resolve, 200));

      const result = await Model.findOne({ _id: record._id });
      expect(result).to.eql(null);
    });
  });

  context('when the operationType is insert', function() {
    it('inserts the fullDocument into MongoDB', async function() {
      const _id = mongoose.Types.ObjectId();
      const payload: IDatabasePayload<any> = {
        documentKey: { _id },
        fullDocument: {
          _id,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ns: { coll: chance.hash({ length: 16 }), db: chance.hash({ length: 16 }) },
        operationType: 'insert',
      };

      const { coll, db } = payload.ns;
      const topic = `${db}.${coll}`;

      subscribe(Model as any, { group: chance.hash(), topic });

      await publish(payload);

      // Wait for message to be published.
      await new Promise<void>(async resolve => {
        const consumer = connection.consumer({ groupId: `${chance.hash()}-${topic}` });
        await consumer.connect();

        await consumer.subscribe({ fromBeginning: true, topic });
        await consumer.run({ eachMessage: async () => resolve() });
      });
      await new Promise(resolve => setTimeout(resolve, 200));

      const result = (await Model.findOne({ _id: payload.fullDocument._id })) as any;
      expect(result._id.toString()).to.eql(payload.fullDocument._id.toString());
      expect(result.createdAt).to.eql(payload.fullDocument.createdAt);
      expect(result.updatedAt).to.eql(payload.fullDocument.updatedAt);
    });
  });

  context('when the operationType is update', function() {
    context('when useUpdateDescription is true', function() {
      it('updates the document within MongoDB', async function() {
        const record = await Model.create({ _id: mongoose.Types.ObjectId() });
        const payload: IDatabasePayload<any> = {
          documentKey: { _id: record._id },
          fullDocument: {
            _id: record._id,
            createdAt: new Date(),
            name: chance.hash(),
            updatedAt: new Date(),
          },
          ns: { coll: chance.hash({ length: 16 }), db: chance.hash({ length: 16 }) },
          operationType: 'update',
          updateDescription: {
            removedFields: ['createdAt'],
            updatedFields: { updatedAt: new Date() },
          },
        };

        const { coll, db } = payload.ns;
        const topic = `${db}.${coll}`;

        subscribe(Model as any, { group: chance.hash(), topic, useUpdateDescription: true });

        await publish(payload);

        // Wait for message to be published.
        await new Promise<void>(async resolve => {
          const consumer = connection.consumer({ groupId: `${chance.hash()}-${topic}` });
          await consumer.connect();

          await consumer.subscribe({ fromBeginning: true, topic });
          await consumer.run({ eachMessage: async () => resolve() });
        });
        await new Promise(resolve => setTimeout(resolve, 200));

        const result: any = await Model.findOne({ _id: record._id });
        expect(result.createdAt).to.not.exist;
        expect(result.updatedAt).to.eql(payload.updateDescription.updatedFields.updatedAt);
      });
    });

    context('when useUpdateDescription is false', function() {
      it('updates the document within MongoDB', async function() {
        const record = await Model.create({ _id: mongoose.Types.ObjectId() });
        const payload: IDatabasePayload<any> = {
          documentKey: { _id: record._id },
          fullDocument: {
            _id: record._id,
            createdAt: new Date(),
            name: chance.hash(),
            updatedAt: new Date(),
          },
          ns: { coll: chance.hash({ length: 16 }), db: chance.hash({ length: 16 }) },
          operationType: 'update',
          updateDescription: {
            removedFields: ['createdAt'],
            updatedFields: { updatedAt: new Date() },
          },
        };

        const { coll, db } = payload.ns;
        const topic = `${db}.${coll}`;

        subscribe(Model as any, { group: chance.hash(), topic });

        await publish(payload);

        // Wait for message to be published.
        await new Promise<void>(async resolve => {
          const consumer = connection.consumer({ groupId: `${chance.hash()}-${topic}` });
          await consumer.connect();

          await consumer.subscribe({ fromBeginning: true, topic });
          await consumer.run({ eachMessage: async () => resolve() });
        });
        await new Promise(resolve => setTimeout(resolve, 200));

        const result: any = await Model.findOne({ _id: record._id });
        expect(result._id.toString()).to.eql(payload.fullDocument._id.toString());
        expect(result.createdAt).to.eql(payload.fullDocument.createdAt);
        expect(result.name).to.eql(payload.fullDocument.name);
        expect(result.updatedAt).to.eql(payload.fullDocument.updatedAt);
      });
    });
  });
});
