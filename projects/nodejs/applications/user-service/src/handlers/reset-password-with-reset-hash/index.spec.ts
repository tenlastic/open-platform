import { HttpContext, HttpContextMock, HttpEvent, HttpEventMock, HttpResult, HttpResultMock  } from "@tenlastic/api-module";
import { expect } from "chai";
import * as mongoose from "mongoose";

import { User, UserMock, UserDocument } from "../../models";
import { controller } from ".";

describe("reset-password-with-reset-hash", function() {
  let ctx: HttpContext;
  let evt: HttpEvent;
  let res: HttpResult;
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create({
      isActive: true,
      resetHash: mongoose.Types.ObjectId()
    });

    ctx = new HttpContextMock();
    evt = new HttpEventMock({
      body: {
        password: "newpassword",
        resetHash: user.resetHash,
      }
    });
    res = new HttpResultMock();
  });

  it("returns a success message", async function() {
    await controller(evt, ctx, res);

    expect(res.statusCode).to.eql(204);
  });

  it("updates the user's password", async function() {
    await controller(evt, ctx, res);

    const updatedUser = await User.findOne({ _id: user._id });
    expect(updatedUser.password).to.not.eql(user.password);
  });

  it("clears the user's resetHash", async function() {
    await controller(evt, ctx, res);

    const updatedUser = await User.findOne({ _id: user._id });
    expect(updatedUser.resetHash).to.eql(null);
  });
});
