import { IDatabasePayload } from '@tenlastic/mongoose';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { eachMessage } from './';

type Document = {
  createdAt: Date;
  name: string;
  updatedAt: Date;
} & mongoose.Document;

const chance = new Chance();

const schema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  createdAt: Date,
  name: String,
  updatedAt: Date,
});
const Model = mongoose.model<Document>('Example', schema);

describe('replicate()', function () {
  beforeEach(async function () {
    await Model.deleteMany({});
  });

  context('when the operationType is delete', function () {
    it('deletes the document from MongoDB', async function () {
      const record = await Model.create({ _id: new mongoose.Types.ObjectId() });
      const payload: IDatabasePayload<any> = {
        documentKey: { _id: record._id },
        ns: { coll: chance.hash({ length: 16 }), db: chance.hash({ length: 16 }) },
        operationType: 'delete',
      };
      const subject = `${payload.ns.db}.${payload.ns.coll}`;

      await eachMessage(Model, { durable: chance.hash(), subject }, payload);

      const result = await Model.findOne({ _id: record._id });
      expect(result).to.eql(null);
    });
  });

  context('when the operationType is insert', function () {
    it('inserts the fullDocument into MongoDB', async function () {
      const _id = new mongoose.Types.ObjectId();
      const payload: IDatabasePayload<any> = {
        documentKey: { _id },
        fullDocument: { _id, createdAt: new Date(), updatedAt: new Date() },
        ns: { coll: chance.hash({ length: 16 }), db: chance.hash({ length: 16 }) },
        operationType: 'insert',
      };
      const subject = `${payload.ns.db}.${payload.ns.coll}`;

      await eachMessage(Model, { durable: chance.hash(), subject }, payload);

      const result = (await Model.findOne({ _id: payload.fullDocument._id })) as any;
      expect(result._id).to.eql(payload.fullDocument._id);
      expect(result.createdAt).to.eql(payload.fullDocument.createdAt);
      expect(result.updatedAt).to.eql(payload.fullDocument.updatedAt);
    });
  });

  context('when the operationType is update', function () {
    const _id = new mongoose.Types.ObjectId();
    const payload: IDatabasePayload<any> = {
      documentKey: { _id },
      fullDocument: { _id, name: chance.hash(), updatedAt: new Date() },
      ns: { coll: chance.hash({ length: 16 }), db: chance.hash({ length: 16 }) },
      operationType: 'update',
      updateDescription: { removedFields: ['createdAt'], updatedFields: { updatedAt: new Date() } },
    };
    let record: Document;
    const subject = `${payload.ns.db}.${payload.ns.coll}`;

    beforeEach(async function () {
      record = await Model.create({ _id, createdAt: new Date(), updatedAt: new Date() });
    });

    context('when useUpdateDescription is true', function () {
      it('updates the document within MongoDB', async function () {
        await eachMessage(
          Model,
          { durable: chance.hash(), subject, useUpdateDescription: true },
          payload,
        );

        const result = await Model.findOne({ _id: record._id });
        expect(result.createdAt).to.not.exist;
        expect(result.updatedAt).to.eql(payload.updateDescription.updatedFields.updatedAt);
      });
    });

    context('when useUpdateDescription is false', function () {
      it('updates the document within MongoDB', async function () {
        await eachMessage(Model, { durable: chance.hash(), subject }, payload);

        const result = await Model.findOne({ _id: record._id });
        expect(result._id).to.eql(payload.fullDocument._id);
        expect(result.createdAt).to.eql(record.createdAt);
        expect(result.name).to.eql(payload.fullDocument.name);
        expect(result.updatedAt).to.eql(payload.fullDocument.updatedAt);
      });
    });
  });
});
