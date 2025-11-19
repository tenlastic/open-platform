import { expect } from 'chai';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { ContextMock } from '../../mocks';
import { count, CountContext, dependencies } from './';

const Schema = new mongoose.Schema({ name: String });
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>('handlers/count', Schema);
const Permissions = {};

describe('handlers/count', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('returns the number of matching records', async function () {
    const ctx = ContextMock<CountContext<Document>>();

    sinon.stub(dependencies, 'count').resolves(1);

    const handler = count(Model, Permissions);
    await handler(ctx);

    expect(ctx.response.body.count).to.eql(1);
  });
});
