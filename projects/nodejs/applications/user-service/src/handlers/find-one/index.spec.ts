import { HttpContextMock, HttpEventMock, HttpResultMock } from "@tenlastic/api-module";
import { expect } from "chai";

import { UserMock, UserDocument } from "../../models";
import { controller } from ".";

describe("find-one", function() {
  let record: UserDocument;
  let user: any;

  beforeEach(async function() {
    record = await UserMock.create();
    user = { level: 1 };
  });

  it("returns the matching record", async function() {
    const ctx = new HttpContextMock();
    const evt = new HttpEventMock({
      pathParameters: { id: record._id },
      user
    });
    const res = new HttpResultMock();

    await controller(evt, ctx, res);

    expect(res.body.record).to.exist;
    expect(res.body.record.id).to.eql(record.id);
  });
});
