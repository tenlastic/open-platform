import { HttpContextMock, HttpEventMock, HttpResultMock } from "@tenlastic/api-module";
import { expect } from "chai";

import { UserMock, UserDocument } from "../../models";
import { controller } from ".";

describe("reset-password", function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create({ isActive: true });
  });

  it("returns a success message", async function() {
    const ctx = new HttpContextMock();
    const evt = new HttpEventMock({
      body: { email: user.email }
    });
    const res = new HttpResultMock();

    await controller(evt, ctx, res);

    expect(res.statusCode).to.eql(204);
  });
});
