import { expect } from 'chai';
import * as Chance from 'chance';
import * as sinon from 'sinon';

import { ChangeDataCapture, ChangeDataCaptureEvent, ChangeDataCaptureDocument } from './model';
import { IDatabasePayload } from './plugin';

const chance = new Chance();

describe('plugin', function() {
  describe(`post('findOneAndDelete')`, function() {
    it('emits an event', async function() {
      const record = await ChangeDataCapture.create({ name: chance.hash() });

      const spy = sinon.spy();
      ChangeDataCaptureEvent.once(spy);

      await ChangeDataCapture.findOneAndDelete({ _id: record._id });

      const args: IDatabasePayload<ChangeDataCaptureDocument> = spy.getCall(0).args[0];
      expect(args.documentKey._id.toString()).to.eql(record._id.toString());
      expect(args.ns).to.eql({ db: process.env.MONGO_DATABASE_NAME, coll: 'changedatacaptures' });
      expect(args.operationType).to.eql('delete');
    });
  });

  describe(`post('findOneAndUpdate')`, function() {
    it('emits an event', async function() {
      const initialRecord = await ChangeDataCapture.create({ age: chance.integer() });

      const spy = sinon.spy();
      ChangeDataCaptureEvent.once(spy);

      // Find the record without including the age to make sure age is included in payload.
      const name = chance.hash();
      const record = await ChangeDataCapture.findOneAndUpdate(
        { _id: initialRecord._id },
        { name, $unset: { age: 1 } },
      );

      const args: IDatabasePayload<ChangeDataCaptureDocument> = spy.getCall(0).args[0];
      expect(args.documentKey._id.toString()).to.eql(record._id.toString());
      expect(args.fullDocument.toObject()).to.eql({ ...record.toObject(), name });
      expect(args.ns).to.eql({ db: process.env.MONGO_DATABASE_NAME, coll: 'changedatacaptures' });
      expect(args.operationType).to.eql('update');
      expect(args.updateDescription.removedFields).to.eql(['age']);
      expect(args.updateDescription.updatedFields).to.eql({
        name,
        updatedAt: record.updatedAt,
      });
    });
  });

  describe(`post('init')`, function() {
    beforeEach(async function() {
      await ChangeDataCapture.create({});
    });

    it(`copies the document's properties to _original`, async function() {
      const record = await ChangeDataCapture.findOne();

      expect(record['_original']).to.exist;
      expect(record['_original']._id.toString()).to.eql(record._id.toString());
    });
  });

  describe(`post('remove')`, function() {
    it('emits an event', async function() {
      const record = await ChangeDataCapture.create({ name: chance.hash() });

      const spy = sinon.spy();
      ChangeDataCaptureEvent.once(spy);

      await record.remove();

      const args: IDatabasePayload<ChangeDataCaptureDocument> = spy.getCall(0).args[0];
      expect(args.documentKey._id.toString()).to.eql(record._id.toString());
      expect(args.ns).to.eql({ db: process.env.MONGO_DATABASE_NAME, coll: 'changedatacaptures' });
      expect(args.operationType).to.eql('delete');
    });
  });

  describe(`post('save')`, function() {
    context('when the document is new', function() {
      it('emits an event', async function() {
        const spy = sinon.spy();
        ChangeDataCaptureEvent.once(spy);

        const record = await ChangeDataCapture.create({ name: chance.hash() });

        const args: IDatabasePayload<ChangeDataCaptureDocument> = spy.getCall(0).args[0];
        expect(args.documentKey._id.toString()).to.eql(record._id.toString());
        expect(args.fullDocument.toObject()).to.eql(record.toObject());
        expect(args.ns).to.eql({ db: process.env.MONGO_DATABASE_NAME, coll: 'changedatacaptures' });
        expect(args.operationType).to.eql('insert');
      });
    });

    context('when the document is not new', function() {
      it('emits an event', async function() {
        const initialRecord = await ChangeDataCapture.create({ age: chance.integer() });

        const spy = sinon.spy();
        ChangeDataCaptureEvent.once(spy);

        // Find the record without including the age to make sure age is included in payload.
        const record = await ChangeDataCapture.findOne({ _id: initialRecord._id }).select([
          '_id',
          'createdAt',
          'updatedAt',
        ]);
        record.name = chance.hash();
        await record.save();

        const args: IDatabasePayload<ChangeDataCaptureDocument> = spy.getCall(0).args[0];
        expect(args.documentKey._id.toString()).to.eql(record._id.toString());
        expect(args.fullDocument.toObject()).to.eql({
          ...initialRecord.toObject(),
          ...record.toObject(),
        });
        expect(args.ns).to.eql({ db: process.env.MONGO_DATABASE_NAME, coll: 'changedatacaptures' });
        expect(args.operationType).to.eql('update');
        expect(args.updateDescription.removedFields).to.eql([]);
        expect(args.updateDescription.updatedFields).to.eql({
          name: record.name,
          updatedAt: record.updatedAt,
        });
      });
    });
  });
});
