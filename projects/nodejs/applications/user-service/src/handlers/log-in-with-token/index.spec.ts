import { HttpContextMock, HttpEventMock, HttpResultMock } from "@tenlastic/api-module";
import { expect } from "chai";
import * as jwt from "jsonwebtoken";

import { UserMock, UserDocument } from "../../models";
import { controller } from ".";

describe("log-in-with-refresh-token", function() {
  let token: string;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create({ isActive: true });
    token = jwt.sign({ user }, process.env.JWT_SECRET);
  });

  it("returns the refresh token, token, and user", async function() {
    const ctx = new HttpContextMock();
    const evt = new HttpEventMock({
      body: { token }
    });
    const res = new HttpResultMock();

    await controller(evt, ctx, res);

    expect(res.body.accessToken).to.exist;
    expect(res.body.refreshToken).to.exist;
    expect(res.body.user).to.exist;
  });
});
