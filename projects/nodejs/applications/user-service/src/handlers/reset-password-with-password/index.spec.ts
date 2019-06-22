import { HttpContext, HttpContextMock, HttpEvent, HttpEventMock, HttpResult, HttpResultMock } from "@tenlastic/api-module";
import { expect } from "chai";
import * as Chance from "chance";

import { User, UserMock, UserDocument } from "../../models";
import { controller } from ".";

const chance = new Chance();

describe("reset-password-with-password", function() {
  let ctx: HttpContext;
  let evt: HttpEvent;
  let password: string;
  let res: HttpResult;
  let user: UserDocument;

  beforeEach(async function() {
    password = chance.hash();
    user = await UserMock.create({ isActive: true, password });

    ctx = new HttpContextMock();
    evt = new HttpEventMock({
      body: {
        email: user.email,
        newPassword: chance.hash(),
        password,
      }
    });
    res = new HttpResultMock();
  });

  context("when the input is valid", function() {
    it("returns a successful status code", async function() {
      await controller(evt, ctx, res);

      expect(res.statusCode).to.eql(204);
    });

    it("updates the user's password", async function() {
      const previousPassword = user.password;
      await controller(evt, ctx, res);

      const updatedUser = await User.findOne({ _id: user._id });
      expect(updatedUser.password).to.not.eql(previousPassword);
    });
  });

  context("when the inputs are missing", function() {
    it("throws an error", function() {
      evt.body.newPassword = null;
      evt.body.password = null;

      const promise = controller(evt, ctx, res);

      return expect(promise).to.be.rejectedWith("Invalid password.");
    });
  });

  context("when the current password is invalid", function() {
    it("throws an error", function() {
      evt.body.newPassword = chance.hash();
      evt.body.password = chance.hash();

      const promise = controller(evt, ctx, res);

      return expect(promise).to.be.rejectedWith("Invalid password.");
    });
  });
});
