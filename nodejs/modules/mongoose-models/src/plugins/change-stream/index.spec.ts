import { expect } from 'chai';
import * as Chance from 'chance';
import mongoose from 'mongoose';
import * as sinon from 'sinon';

import { EventEmitter } from '../../event-emitter';
import { changeStreamPlugin, IDatabasePayload } from './';

const chance = new Chance();

type Document = { age: number; name: string } & mongoose.Document;
const ExampleEvent = new EventEmitter<IDatabasePayload<Document>>();
const schema = new mongoose.Schema<Document>(
  { age: Number, name: String },
  { collection: 'examples' },
);
schema.plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: ExampleEvent,
  fetchFullDocumentOnSave: true,
});
const Model = mongoose.model<Document>('Example', schema);

describe('plugins/change-stream', function () {
  beforeEach(async function () {
    await Model.deleteMany();
  });

  describe(`post('findOneAndDelete')`, function () {
    it('emits an event', async function () {
      const record = await Model.create({ name: chance.hash() });

      const spy = sinon.spy();
      const stub = async (value: any) => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        return spy(value);
      };
      ExampleEvent.async(stub);

      await Model.findOneAndDelete({ _id: record._id });

      const args: IDatabasePayload<Document> = spy.getCall(0).args[0];
      expect(args.documentKey._id.toString()).to.eql(record._id.toString());
      expect(args.fullDocument._id.toString()).to.eql(record._id.toString());
      expect(args.ns).to.eql({ coll: 'examples', db: 'mongoose-models' });
      expect(args.operationType).to.eql('delete');
    });
  });

  describe(`post('findOneAndUpdate')`, function () {
    it('emits an event', async function () {
      const initialRecord = await Model.create({ age: chance.integer() });

      const spy = sinon.spy();
      const stub = async (value: any) => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        return spy(value);
      };
      ExampleEvent.async(stub);

      // Find the record without including the age to make sure age is included in payload.
      const name = chance.hash();
      const record = await Model.findOneAndUpdate(
        { _id: initialRecord._id },
        { $unset: { age: 1 }, name },
      );

      const args: IDatabasePayload<Document> = spy.getCall(0).args[0];
      expect(args.documentKey._id.toString()).to.eql(record._id.toString());
      expect(args.fullDocument.toObject()).to.eql({ ...record.toObject(), name });
      expect(args.ns).to.eql({ coll: 'examples', db: 'mongoose-models' });
      expect(args.operationType).to.eql('update');
      expect(args.updateDescription.removedFields).to.eql(['age']);
      expect(args.updateDescription.updatedFields).to.eql({ name });
    });
  });

  describe(`post('init')`, function () {
    beforeEach(async function () {
      await Model.create({});
    });

    it(`copies the document's properties to _original`, async function () {
      const record = await Model.findOne();

      expect(record['_original']).to.exist;
      expect(record['_original']._id.toString()).to.eql(record._id.toString());
    });
  });

  describe(`post('remove')`, function () {
    it('emits an event', async function () {
      const record = await Model.create({ name: chance.hash() });

      const spy = sinon.spy();
      const stub = async (value: any) => {
        await new Promise((resolve) => setTimeout(resolve, 0));
        return spy(value);
      };
      ExampleEvent.async(stub);

      await record.remove();

      const args: IDatabasePayload<Document> = spy.getCall(0).args[0];
      expect(args.documentKey._id.toString()).to.eql(record._id.toString());
      expect(args.fullDocument._id.toString()).to.eql(record._id.toString());
      expect(args.ns).to.eql({ coll: 'examples', db: 'mongoose-models' });
      expect(args.operationType).to.eql('delete');
    });
  });

  describe(`post('save')`, function () {
    context('when the document is new', function () {
      it('emits an event', async function () {
        const spy = sinon.spy();
        ExampleEvent.async(spy);

        const record = await Model.create({ name: chance.hash() });

        const args: IDatabasePayload<Document> = spy.getCall(0).args[0];
        expect(args.documentKey._id.toString()).to.eql(record._id.toString());
        expect(args.fullDocument.toObject()).to.eql(record.toObject());
        expect(args.ns).to.eql({ coll: 'examples', db: 'mongoose-models' });
        expect(args.operationType).to.eql('insert');
      });
    });

    context('when the document is not new', function () {
      it('emits an event', async function () {
        const initialRecord = await Model.create({ age: chance.integer() });

        const spy = sinon.spy();
        const stub = async (value: any) => {
          await new Promise((resolve) => setTimeout(resolve, 0));
          return spy(value);
        };
        ExampleEvent.async(stub);

        // Find the record without including the age to make sure age is included in payload.
        const record = await Model.findOne({ _id: initialRecord._id }).select(['_id']);
        record.name = chance.hash();
        await record.save();

        const args: IDatabasePayload<Document> = spy.getCall(0).args[0];
        expect(args.documentKey._id.toString()).to.eql(record._id.toString());
        expect(args.fullDocument.toObject()).to.eql({
          ...initialRecord.toObject(),
          ...record.toObject(),
        });
        expect(args.ns).to.eql({ coll: 'examples', db: 'mongoose-models' });
        expect(args.operationType).to.eql('update');
        expect(args.updateDescription.removedFields).to.eql([]);
        expect(args.updateDescription.updatedFields).to.eql({ name: record.name });
      });
    });
  });
});
