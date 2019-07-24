import { expect } from 'chai';
import * as sinon from 'sinon';

import {
  ChangeDataCapture,
  ChangeDataCaptureCreated,
  ChangeDataCaptureDeleted,
  ChangeDataCaptureUpdated,
} from './change-data-capture.model';

describe('data-change-plugin', function() {
  describe(`post('findOneAndDelete')`, function() {
    it('emits an OnDelete event', async function() {
      const changeDataCapture = await ChangeDataCapture.create({});

      const spy = sinon.spy();
      ChangeDataCaptureDeleted.once(spy);

      await ChangeDataCapture.findOneAndDelete({ _id: changeDataCapture._id });

      expect(spy.calledOnce).to.eql(true);
      expect(spy.getCall(0).args[0].after).to.eql(null);
      expect(spy.getCall(0).args[0].before._id.toString()).to.eql(changeDataCapture._id.toString());
    });
  });

  describe(`post('init')`, function() {
    beforeEach(async function() {
      await ChangeDataCapture.create({});
    });

    it(`copies the document's properties to _original`, async function() {
      const changeDataCapture = await ChangeDataCapture.findOne();

      expect(changeDataCapture['_original']).to.exist;
      expect(changeDataCapture['_original']._id.toString()).to.eql(
        changeDataCapture._id.toString(),
      );
    });
  });

  describe(`post('remove')`, function() {
    it('emits an OnDelete event', async function() {
      const changeDataCapture = await ChangeDataCapture.create({});

      const spy = sinon.spy();
      ChangeDataCaptureDeleted.once(spy);

      await changeDataCapture.remove();

      expect(spy.calledOnce).to.eql(true);
      expect(spy.getCall(0).args[0].after).to.eql(null);
      expect(spy.getCall(0).args[0].before._id.toString()).to.eql(changeDataCapture._id.toString());
    });
  });

  describe(`post('save')`, function() {
    context('when the document is new', function() {
      it('emits an OnCreate event', async function() {
        const spy = sinon.spy();
        ChangeDataCaptureCreated.once(spy);

        const changeDataCapture = await ChangeDataCapture.create({});

        expect(spy.calledOnce).to.eql(true);
        expect(spy.getCall(0).args[0].after._id.toString()).to.eql(
          changeDataCapture._id.toString(),
        );
        expect(spy.getCall(0).args[0].before).to.eql(null);
      });
    });

    context('when the document is not new', function() {
      it('emits an OnUpdate event', async function() {
        const changeDataCapture = await ChangeDataCapture.create({});

        const spy = sinon.spy();
        ChangeDataCaptureUpdated.once(spy);

        await changeDataCapture.save();

        expect(spy.calledOnce).to.eql(true);
        expect(spy.getCall(0).args[0].after._id.toString()).to.eql(
          changeDataCapture._id.toString(),
        );
        expect(spy.getCall(0).args[0].before._id.toString()).to.eql(
          changeDataCapture._id.toString(),
        );
      });
    });
  });
});
