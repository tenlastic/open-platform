import { HttpContextMock, HttpEventMock, HttpResultMock } from '@tenlastic/api-module';
import { expect } from 'chai';

import { UserMock, UserDocument } from '../../models';
import { controller } from '.';

describe('count', function() {
  let record: UserDocument;
  let user: any;

  beforeEach(async function() {
    record = await UserMock.create();
    user = { level: 1 };
  });

  it('returns the number of matching records', async function() {
    const ctx = new HttpContextMock();
    const evt = new HttpEventMock({
      queryStringParameters: {},
      user,
    });
    const res = new HttpResultMock();

    await controller(evt, ctx, res);

    expect(res.body.count).to.eql(1);
  });
});
