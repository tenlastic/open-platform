import { HttpContextMock, HttpEventMock, HttpResultMock } from "@tenlastic/api-module";
import { expect } from "chai";

import { UserMock, UserDocument } from "../../models";
import { controller } from ".";

describe("delete", function() {
  let record: UserDocument;
  let user: any;

  beforeEach(async function() {
    record = await UserMock.create();
    user = { level: 1 };
  });

  it("returns the deleted record", async function() {
    const ctx = new HttpContextMock();
    const evt = new HttpEventMock({
      pathParameters: { id: record.id },
      user
    });
    const res = new HttpResultMock();

    await controller(evt, ctx, res);

    expect(res.body.record).to.exist;
  });
});
