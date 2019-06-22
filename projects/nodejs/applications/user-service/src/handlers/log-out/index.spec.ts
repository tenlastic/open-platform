import { HttpContextMock, HttpEventMock, HttpResultMock } from "@tenlastic/api-module";
import { expect } from "chai";

import { controller } from ".";

describe("log-out", function() {
  it("returns a success status", async function() {
    const ctx = new HttpContextMock();
    const evt = new HttpEventMock();
    const res = new HttpResultMock();

    await controller(evt, ctx, res);

    expect(res.statusCode).to.eql(204);
  });
});
